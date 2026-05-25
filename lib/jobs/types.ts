export type Channel =
  | "audit"
  | "seo"
  | "funnel"
  | "email"
  | "deliverability"
  | "social"
  | "browser"
  | "inventory"
  | "ivr";

export type JobStatus = "pending" | "running" | "done" | "failed";

export type FindingSeverity = "ok" | "warn" | "issue";

export type Finding = {
  severity: FindingSeverity;
  label: string;
  detail?: string;
};

export type JobResult = {
  score: number;
  summary: string;
  findings: Finding[];
  details?: Record<string, unknown>;
};

export type Job = {
  channel: Channel;
  status: JobStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  result?: JobResult;
  error?: string;
};

export type Run = {
  id: string;
  url: string;
  hostname: string;
  customer: string;
  plan: "Starter" | "Standard" | "Professional";
  createdAt: string;
  jobs: Record<Channel, Job>;
};

export const channels: Channel[] = [
  "audit",
  "seo",
  "funnel",
  "email",
  "deliverability",
  "social",
  "browser",
  "inventory",
  "ivr",
];

export const channelLabels: Record<Channel, string> = {
  audit: "Comms Clarity",
  seo: "Buyer Discoverability",
  funnel: "Conversion Path",
  email: "Email Touchpoints",
  deliverability: "Comms Surface Security",
  social: "Social Presence",
  browser: "Synthetic Comms Check",
  inventory: "Comms Surfaces Inventory",
  ivr: "IVR Audit (Sample Data — production version scans your prospect's actual IVR)",
};
