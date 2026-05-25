import type { Finding, JobResult } from "./types";

// IVR audit — SAMPLE mode.
//
// Production version scores a customer-supplied IVR tree (JSON spec). For
// the MVP demo, this channel runs against a built-in sample tree so the
// generated PDF always includes an IVR-audit section illustrating what
// the production scorer would emit.
//
// Replace SAMPLE_IVR with an uploaded spec once the JSON-upload endpoint
// exists. Scorer logic stays the same.

type IvrNode = {
  id: string;
  prompt: string;
  options?: { dtmf: string; label: string; goto: string }[];
  terminal?: "transfer_agent" | "voicemail" | "hangup" | "dead_end";
};

type IvrSpec = {
  name: string;
  rootId: string;
  nodes: IvrNode[];
};

const SAMPLE_IVR: IvrSpec = {
  name: "BlueComm Communications (sample)",
  rootId: "n0",
  nodes: [
    {
      id: "n0",
      prompt: "Welcome to BlueComm. Please listen carefully as our menu options have changed. Press 1 for sales, 2 for support, 3 for billing, 4 for everything else.",
      options: [
        { dtmf: "1", label: "Sales", goto: "n1" },
        { dtmf: "2", label: "Support", goto: "n2" },
        { dtmf: "3", label: "Billing", goto: "n3" },
        { dtmf: "4", label: "Other", goto: "n4" },
      ],
    },
    {
      id: "n1",
      prompt: "For new customer inquiries press 1, to speak with your account manager press 2.",
      options: [
        { dtmf: "1", label: "New customer", goto: "n5" },
        { dtmf: "2", label: "Account manager", goto: "n6" },
      ],
    },
    {
      id: "n2",
      prompt: "Please describe your issue after the tone. Calls may be recorded for training.",
      terminal: "voicemail",
    },
    {
      id: "n3",
      prompt: "For billing questions, please visit our website at bluecomm dot example dot com slash billing.",
      terminal: "hangup",
    },
    {
      id: "n4",
      prompt: "We could not process your selection. Goodbye.",
      terminal: "dead_end",
    },
    {
      id: "n5",
      prompt: "Thank you. An agent will be with you shortly.",
      terminal: "transfer_agent",
    },
    {
      id: "n6",
      prompt: "Please hold while we look up your account.",
      terminal: "transfer_agent",
    },
  ],
};

function computeDepth(spec: IvrSpec): number {
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  let max = 0;
  function walk(id: string, d: number, seen: Set<string>) {
    if (seen.has(id)) return;
    seen.add(id);
    if (d > max) max = d;
    const n = byId.get(id);
    if (!n?.options) return;
    for (const o of n.options) walk(o.goto, d + 1, seen);
  }
  walk(spec.rootId, 1, new Set());
  return max;
}

function findDeadEnds(spec: IvrSpec): string[] {
  return spec.nodes.filter((n) => n.terminal === "dead_end").map((n) => n.id);
}

function findHangupsWithoutTransfer(spec: IvrSpec): string[] {
  // Hangup terminals that don't first offer an agent — friction indicator
  return spec.nodes
    .filter((n) => n.terminal === "hangup")
    .map((n) => n.id);
}

function hasGdprDisclosure(spec: IvrSpec): boolean {
  const allText = spec.nodes.map((n) => n.prompt).join(" ").toLowerCase();
  return /\b(gdpr|data protection|privacy notice|personal data|consent)\b/.test(allText);
}

function hasRecordingDisclosure(spec: IvrSpec): boolean {
  const allText = spec.nodes.map((n) => n.prompt).join(" ").toLowerCase();
  return /\b(record(ed|ing)|monitored|quality (and|or) training)\b/.test(allText);
}

function hasOptOutPath(spec: IvrSpec): boolean {
  // Any node with an agent-transfer option reachable from root counts as opt-out
  return spec.nodes.some((n) => n.terminal === "transfer_agent");
}

function clarityIssues(spec: IvrSpec): string[] {
  const issues: string[] = [];
  for (const n of spec.nodes) {
    const words = n.prompt.split(/\s+/).length;
    if (words > 40) {
      issues.push(`Node ${n.id}: prompt is ${words} words (over 40 — caller may lose track).`);
    }
    if (/menu options have changed/i.test(n.prompt)) {
      issues.push(`Node ${n.id}: uses "menu options have changed" — known disengagement trigger.`);
    }
    if (n.options && n.options.length > 5) {
      issues.push(`Node ${n.id}: offers ${n.options.length} options (over 5 — increases routing errors).`);
    }
  }
  return issues;
}

export async function runIvr(_rawUrl: string): Promise<JobResult> {
  // Future: replace SAMPLE_IVR with an uploaded spec, keyed off run metadata.
  const spec = SAMPLE_IVR;

  const findings: Finding[] = [];

  findings.push({
    severity: "ok",
    label: `IVR audit — SAMPLE: ${spec.name}`,
    detail: `This is a built-in sample IVR tree. Production version scans a customer-supplied IVR JSON spec. Scoring logic identical.`,
  });

  const depth = computeDepth(spec);
  findings.push({
    severity: depth <= 4 ? "ok" : depth <= 6 ? "warn" : "issue",
    label: `Menu depth: ${depth} level${depth === 1 ? "" : "s"}`,
    detail: depth > 4
      ? "Industry guidance: keep IVR menus at 3–4 levels max. Beyond 4 levels, caller abandonment climbs sharply."
      : "Within recommended depth.",
  });

  const deadEnds = findDeadEnds(spec);
  if (deadEnds.length > 0) {
    findings.push({
      severity: "issue",
      label: `${deadEnds.length} dead-end node${deadEnds.length === 1 ? "" : "s"} detected`,
      detail: `Nodes: ${deadEnds.join(", ")}. Caller reaches an explicit dead end with no recovery path.`,
    });
  }

  const hangups = findHangupsWithoutTransfer(spec);
  if (hangups.length > 0) {
    findings.push({
      severity: "warn",
      label: `${hangups.length} terminal hangup node${hangups.length === 1 ? "" : "s"} without agent transfer`,
      detail: `Nodes: ${hangups.join(", ")}. Caller is referred to web/self-service and hung up on — no agent escalation.`,
    });
  }

  if (hasGdprDisclosure(spec)) {
    findings.push({ severity: "ok", label: "GDPR / privacy disclosure present in prompts" });
  } else {
    findings.push({
      severity: "issue",
      label: "No GDPR / privacy disclosure detected in any prompt",
      detail: "Required for EU callers. Root prompt should reference data processing under GDPR or equivalent regional regulation.",
    });
  }

  if (hasRecordingDisclosure(spec)) {
    findings.push({ severity: "ok", label: "Call-recording disclosure present" });
  } else {
    findings.push({
      severity: "warn",
      label: "No call-recording disclosure detected",
      detail: "If calls are recorded, the caller must be informed before recording begins (EU two-party consent equivalent).",
    });
  }

  if (hasOptOutPath(spec)) {
    findings.push({ severity: "ok", label: "Live agent transfer path available" });
  } else {
    findings.push({
      severity: "issue",
      label: "No live agent transfer path detected",
      detail: "Caller has no escape from the menu tree — known driver of negative CSAT.",
    });
  }

  const clarity = clarityIssues(spec);
  for (const c of clarity) {
    findings.push({ severity: "warn", label: c });
  }

  // Score: start at 100, deduct
  let score = 100;
  for (const f of findings) {
    if (f.severity === "issue") score -= 15;
    if (f.severity === "warn") score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    summary: `Sample IVR audit for ${spec.name}. ${findings.filter((f) => f.severity === "issue").length} critical · ${findings.filter((f) => f.severity === "warn").length} watch.`,
    findings,
    details: {
      ivrName: spec.name,
      depth,
      nodeCount: spec.nodes.length,
      deadEnds,
      hangups,
      gdpr: hasGdprDisclosure(spec),
      recording: hasRecordingDisclosure(spec),
      optOut: hasOptOutPath(spec),
      sampleMode: true,
    },
  };
}
