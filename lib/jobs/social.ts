import * as cheerio from "cheerio";
import { fetchPage } from "./fetch";
import type { Finding, JobResult } from "./types";

type DraftPost = {
  platform: "LinkedIn" | "X" | "Instagram";
  text: string;
};

export async function runSocial(url: string): Promise<JobResult> {
  const page = await fetchPage(url);
  const $ = cheerio.load(page.html);

  const title =
    $("head > title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";
  const description =
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    $("p").first().text().trim();

  const h2s = $("h2")
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean)
    .slice(0, 5);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let drafts: DraftPost[];
  let llmUsed = false;
  let llmError: string | undefined;

  if (apiKey) {
    try {
      drafts = await draftWithClaude({ title, description, h2s, apiKey });
      llmUsed = true;
    } catch (e) {
      llmError = e instanceof Error ? e.message : String(e);
      drafts = templatedDrafts({ title, description, h2s });
    }
  } else {
    drafts = templatedDrafts({ title, description, h2s });
  }

  const findings: Finding[] = [
    {
      severity: "ok",
      label: `Site title: "${title}"`,
    },
    description
      ? {
          severity: "ok",
          label: "Description captured",
          detail: description.slice(0, 140),
        }
      : { severity: "warn", label: "No meta description for context — used first paragraph." },
    {
      severity: "ok",
      label: `${drafts.length} draft post(s) generated.`,
    },
  ];

  return {
    score: drafts.length === 0 ? 50 : 90,
    summary: `${drafts.length} draft post(s) generated for ${title}.`,
    findings,
    details: { drafts, title, description, h2s, llmUsed },
  };
}

function templatedDrafts({
  title,
  description,
  h2s,
}: {
  title: string;
  description?: string;
  h2s: string[];
}): DraftPost[] {
  const short =
    description?.slice(0, 180) ??
    h2s[0] ??
    "What we do, in one line.";
  return [
    {
      platform: "LinkedIn",
      text: `${title}\n\n${short}\n\nIf you're thinking about this for your team, here's where we'd start →`,
    },
    {
      platform: "X",
      text: `${title}: ${short.slice(0, 200)}`,
    },
    {
      platform: "Instagram",
      text: `${title.toUpperCase()}\n\n${short}\n\n— link in bio`,
    },
  ];
}

type ClaudeMessage = { role: "user" | "assistant"; content: string };

async function draftWithClaude({
  title,
  description,
  h2s,
  apiKey,
}: {
  title: string;
  description?: string;
  h2s: string[];
  apiKey: string;
}): Promise<DraftPost[]> {
  const prompt = `You are drafting platform-ready social posts for a business after scraping their homepage.

Site title: ${title}
Description: ${description ?? "(not provided)"}
Section headings: ${h2s.join(" | ") || "(none)"}

Output exactly 3 posts as JSON:
[
  { "platform": "LinkedIn", "text": "..." },
  { "platform": "X", "text": "..." },
  { "platform": "Instagram", "text": "..." }
]

Rules:
- LinkedIn: 2–4 short paragraphs, conversational, end with a soft question or invitation. <= 1000 chars.
- X: single line, <= 240 chars.
- Instagram: 2–3 short lines, end with "link in bio".
- No hashtags, no emojis, no exclamation marks.
- Plain factual tone matching a Scandinavian-clean brand.
- Output JSON only, no prose around it.`;

  const messages: ClaudeMessage[] = [{ role: "user", content: prompt }];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { content?: { type: string; text: string }[] };
  const text = json.content?.find((c) => c.type === "text")?.text ?? "";
  // Best-effort JSON extraction
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("LLM did not return JSON array.");
  const parsed = JSON.parse(match[0]) as DraftPost[];
  return parsed.filter((p) => p && p.platform && p.text);
}
