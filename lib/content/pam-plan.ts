import type { PamPlanItem } from "@/lib/types";

export type Severity = "ok" | "warn" | "issue";

export type Kpi = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
};

export type ActivityEvent = {
  ago: string;
  kind:
    | "report"
    | "crawl"
    | "ab"
    | "email"
    | "monitor"
    | "alert";
  message: string;
};

export type ScheduledJob = {
  name: string;
  cadence: string;
  nextRun: string;
};

export type Property = {
  domain: string;
  plan: "Starter" | "Standard" | "Professional";
  status: Severity;
  lastScan: string;
  issues: number;
  conversionDelta?: string;
};

export const navigationItems: string[] = [
  "Dashboard",
  "Website Scan",
  "Payment Tests",
  "Email Automations",
  "Social Content",
  "Reports",
];

export const automationPlan: PamPlanItem[] = [
  { cadence: "Daily", description: "Crawl site, detect errors." },
  {
    cadence: "Weekly",
    description: "Full scan, A/B test, email review, report.",
  },
  { cadence: "Monthly", description: "Deep content review." },
  {
    cadence: "Triggers",
    description: "Conversion drop, page change, automation failure.",
  },
];

export const kpis: Kpi[] = [
  { label: "Sites monitored", value: "12", delta: "+2", trend: "up" },
  { label: "Open issues", value: "7", delta: "−3", trend: "down" },
  { label: "Reports this week", value: "4", delta: "on schedule", trend: "flat" },
  { label: "Avg conversion Δ", value: "+2.3%", delta: "+0.4 pp", trend: "up" },
];

export const recentActivity: ActivityEvent[] = [
  {
    ago: "1h ago",
    kind: "crawl",
    message: "Crawl complete — copenhagen-tech.dk: 4 issues found",
  },
  {
    ago: "2h ago",
    kind: "report",
    message: "Weekly report generated — Week 20",
  },
  {
    ago: "3h ago",
    kind: "alert",
    message: "Broken link detected — helsinki-shop.fi/products/old-promo",
  },
  {
    ago: "6h ago",
    kind: "ab",
    message: "A/B test concluded — variant B wins on nordicpay.se (+4.1%)",
  },
  {
    ago: "12h ago",
    kind: "email",
    message: "Email triggers validated — aurora-saas.com onboarding sequence",
  },
  {
    ago: "1d ago",
    kind: "monitor",
    message: "Metadata change detected — stockholm-fitness.se home page",
  },
  {
    ago: "2d ago",
    kind: "report",
    message: "Before/after report published — gothenburg-clinic.se",
  },
];

export const scheduledJobs: ScheduledJob[] = [
  { name: "Daily crawl — all sites", cadence: "Every day · 04:00", nextRun: "in 1h 23m" },
  { name: "Weekly report", cadence: "Fridays · 09:00", nextRun: "in 2d 4h" },
  { name: "A/B test rollover — nordicpay.se checkout", cadence: "Weekly", nextRun: "in 5d" },
  { name: "Monthly deep content review", cadence: "Monthly", nextRun: "in 12d" },
];

export const properties: Property[] = [
  {
    domain: "nordicpay.se",
    plan: "Professional",
    status: "ok",
    lastScan: "2h ago",
    issues: 0,
    conversionDelta: "+4.1%",
  },
  {
    domain: "helsinki-shop.fi",
    plan: "Standard",
    status: "warn",
    lastScan: "3h ago",
    issues: 1,
    conversionDelta: "+0.6%",
  },
  {
    domain: "copenhagen-tech.dk",
    plan: "Standard",
    status: "issue",
    lastScan: "1h ago",
    issues: 4,
    conversionDelta: "−1.2%",
  },
  {
    domain: "aurora-saas.com",
    plan: "Professional",
    status: "ok",
    lastScan: "5h ago",
    issues: 0,
    conversionDelta: "+3.4%",
  },
  {
    domain: "stockholm-fitness.se",
    plan: "Starter",
    status: "ok",
    lastScan: "8h ago",
    issues: 2,
  },
  {
    domain: "gothenburg-clinic.se",
    plan: "Standard",
    status: "ok",
    lastScan: "4h ago",
    issues: 0,
    conversionDelta: "+1.8%",
  },
];

// Issues found per week, oldest → newest.
export const issuesByWeek: { week: string; issues: number }[] = [
  { week: "W13", issues: 12 },
  { week: "W14", issues: 8 },
  { week: "W15", issues: 15 },
  { week: "W16", issues: 7 },
  { week: "W17", issues: 11 },
  { week: "W18", issues: 6 },
  { week: "W19", issues: 4 },
  { week: "W20", issues: 7 },
];
