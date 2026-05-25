/**
 * Rewrites raw scanner findings into strict Carina-tone JSON via Gemini.
 *
 * Scanners and the ops page render the raw findings as-is. The PDF goes
 * through this rewrite layer so the operator-facing report is Carina-tone
 * even though the underlying scanner data is unchanged.
 *
 * Result is cached per run so we only pay the Gemini call once per scan.
 */
import { channels, channelLabels, type Run } from "@/lib/jobs/types";

export type CarinaRewrite = {
  overall_result: string;
  channel_scores: {
    audit_cro: string;
    seo_technical: string;
    funnel_payment: string;
    email: string;
    social: string;
    synthetic_browser: string;
  };
  channels: {
    name: string;
    status: string;
    score: string;
    scope: string;
    findings: string[];
    required_actions: string[];
  }[];
  summary: string[];
  audit_trail: string;
};

const SYSTEM_INSTRUCTION = `You are a rewrite engine. Your task is to convert raw scanner findings into strict Carina-tone.

Carina-tone rules:
- Short sentences.
- One fact per line.
- One required action per line.
- No marketing language.
- No emotional language.
- No persuasion.
- No narrative.
- No filler.
- No softening ("likely", "should", "suggests", "appears").
- No adjectives except operational ones ("missing", "non-functional", "present").
- No metaphors.
- No assumptions.
- Zero-trust tone.
- Output must be factual, operational, and concise.

Rewrite all dynamic text into Carina-tone.
Do not invent findings.
Do not remove findings.
Do not change severity.
Do not change numbers.
Do not add interpretation.

Structure rules:
1. overall_result (1-2 lines)
2. channel_scores (static keys, dynamic values)
3. channels[] (each with name, status, score, scope, findings[], required_actions[])
4. summary[] (3-4 lines)
5. audit_trail (1 line)

Output must follow the JSON schema exactly.
Do not include explanations.
Do not include commentary.
Return only valid JSON.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overall_result: { type: "string" },
    channel_scores: {
      type: "object",
      properties: {
        audit_cro: { type: "string" },
        seo_technical: { type: "string" },
        funnel_payment: { type: "string" },
        email: { type: "string" },
        social: { type: "string" },
        synthetic_browser: { type: "string" },
      },
      required: [
        "audit_cro",
        "seo_technical",
        "funnel_payment",
        "email",
        "social",
        "synthetic_browser",
      ],
    },
    channels: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          status: { type: "string" },
          score: { type: "string" },
          scope: { type: "string" },
          findings: { type: "array", items: { type: "string" } },
          required_actions: { type: "array", items: { type: "string" } },
        },
        required: ["name", "status", "score", "scope", "findings", "required_actions"],
      },
    },
    summary: { type: "array", items: { type: "string" } },
    audit_trail: { type: "string" },
  },
  required: ["overall_result", "channel_scores", "channels", "summary", "audit_trail"],
};

function buildRawFindingsPayload(run: Run): object {
  return {
    run_id: run.id,
    hostname: run.hostname,
    url: run.url,
    created_at: run.createdAt,
    channels: channels.map((ch) => {
      const job = run.jobs[ch];
      const r = job.result;
      return {
        key: ch,
        name: channelLabels[ch],
        status: job.status,
        score: r?.score ?? null,
        summary: r?.summary ?? "",
        findings: (r?.findings ?? []).map((f) => ({
          severity: f.severity,
          label: f.label,
          detail: f.detail ?? "",
        })),
        details: r?.details ?? null,
      };
    }),
  };
}

const cache = new Map<string, { hash: string; rewrite: CarinaRewrite }>();

function findingsHash(run: Run): string {
  // Cheap deterministic hash so we re-call Gemini only if findings changed.
  const data = channels
    .flatMap((ch) =>
      (run.jobs[ch].result?.findings ?? []).map(
        (f) => `${ch}:${f.severity}:${f.label}:${f.detail ?? ""}`
      )
    )
    .join("|");
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = (h * 31 + data.charCodeAt(i)) | 0;
  }
  return `${run.id}.${h}`;
}

export async function rewriteToCarina(run: Run): Promise<CarinaRewrite | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const cacheKey = run.id;
  const hash = findingsHash(run);
  const cached = cache.get(cacheKey);
  if (cached && cached.hash === hash) return cached.rewrite;

  const raw = buildRawFindingsPayload(run);
  const userPrompt = `Rewrite the following scanner findings into strict Carina-tone using the system rules.
Return only the JSON object.
Do not include explanations.

RAW_FINDINGS:
${JSON.stringify(raw, null, 2)}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  };

  // Retry transient 5xx (overload) with exponential backoff. Quota/auth
  // errors (4xx) fail fast — they will not get better.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) break;
    if (res.status >= 400 && res.status < 500) break;
    const wait = 500 * Math.pow(2, attempt);
    console.warn(`[carina-rewrite] Gemini ${res.status}, retrying in ${wait}ms (attempt ${attempt + 1}/3)`);
    await new Promise((r) => setTimeout(r, wait));
  }

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response";
    console.error("[carina-rewrite] Gemini API error", res?.status ?? "unknown", text.slice(0, 300));
    return null;
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[carina-rewrite] empty response from Gemini");
    return null;
  }

  let rewrite: CarinaRewrite;
  try {
    rewrite = JSON.parse(text) as CarinaRewrite;
  } catch (e) {
    console.error("[carina-rewrite] invalid JSON from Gemini", e instanceof Error ? e.message : e);
    return null;
  }

  cache.set(cacheKey, { hash, rewrite });
  return rewrite;
}
