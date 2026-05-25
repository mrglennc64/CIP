/**
 * Renders a real-data health report PDF from a completed Run.
 *
 * All Carina-tone transformations live in this file. Scanners and the ops
 * dashboard render the raw scanner findings; the PDF reformats them into
 * short, factual statements without modifying the underlying data.
 */
import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Circle,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  channels,
  type Channel,
  type Finding,
  type Job,
  type Run,
} from "@/lib/jobs/types";
import type { CarinaRewrite } from "@/lib/pdf/carina-rewrite";

// Carina-tone channel labels (override the lowercase scanner labels)
const channelLabels: Record<Channel, string> = {
  audit: "Comms Clarity",
  seo: "Buyer Discoverability",
  funnel: "Conversion Path",
  email: "Email Touchpoints",
  deliverability: "Comms Surface Security",
  social: "Social Presence",
  browser: "Synthetic Comms Check",
  inventory: "Comms Surfaces Inventory",
  ivr: "IVR Audit (sample)",
};

// ── Tokens ──────────────────────────────────────────────────────────────
const C = {
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#ffffff",
  bg: "#f7f9fb",
  primary: "#1f6feb",
  primarySoft: "#e3edff",
  ok: "#16a34a",
  okSoft: "#dcfce7",
  okBorder: "#bbf7d0",
  warn: "#ca8a04",
  warnSoft: "#fef9c3",
  warnBorder: "#fde68a",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  dangerBorder: "#fecaca",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.surface,
  },

  pillRow: { flexDirection: "row", marginBottom: 14 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 9, fontFamily: "Helvetica-Bold" },

  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 6 },
  sub: { fontSize: 10, color: C.muted, lineHeight: 1.45 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  heroLeft: { flex: 1, paddingRight: 18 },

  sectionLabel: {
    fontSize: 10,
    color: C.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  kpi: {
    width: "32%",
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
  },
  kpiLabel: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text },
  kpiSub: { fontSize: 8, color: C.muted, marginTop: 3 },

  sectionHead: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 8,
  },

  channelBlock: {
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  channelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  channelHeadLeft: { flexDirection: "row", alignItems: "center" },
  channelTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.text },
  channelScoreBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  channelScoreText: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.text },
  channelScope: { fontSize: 9.5, color: C.muted, marginTop: 4, marginBottom: 6, lineHeight: 1.45 },

  subHead: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginTop: 6,
    marginBottom: 2,
  },

  fieldLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
  },

  findingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
  },
  findingDot: {
    width: 10,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },
  findingText: { flex: 1, fontSize: 9.5, color: C.text, lineHeight: 1.4 },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusPillText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  overallBlock: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.bg,
    marginBottom: 16,
  },
  overallLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  overallText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    lineHeight: 1.4,
  },

  actionBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  actionDot: {
    width: 10,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginTop: 1,
  },
  actionText: { flex: 1, fontSize: 9.5, color: C.text, lineHeight: 1.4 },

  fixitBlock: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#f6f8fa",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
  },
  fixitKind: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 0.4,
  },
  fixitRecord: {
    fontSize: 9,
    fontFamily: "Courier",
    color: C.text,
    marginTop: 2,
    lineHeight: 1.35,
  },
  fixitRationale: {
    fontSize: 8.5,
    color: C.muted,
    marginTop: 3,
    lineHeight: 1.4,
  },

  summary: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: C.bg,
  },
  summaryLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryText: { fontSize: 10, color: C.text, lineHeight: 1.5 },

  audit: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  auditLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  auditText: { fontSize: 9, color: C.muted, lineHeight: 1.5 },

  footer: {
    textAlign: "center",
    fontSize: 8,
    color: C.muted,
    marginTop: 4,
  },
});

// ── Helpers ─────────────────────────────────────────────────────────────
const NUMBER_WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Nine", "Ten",
];
function wordNum(n: number): string {
  if (n >= 0 && n <= 10) return NUMBER_WORDS[n];
  return String(n);
}
function plural(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}

type CarinaLine = { severity: Finding["severity"]; text: string; section?: "homepage" | "checkout" };

// ── Carina-tone label transformation ────────────────────────────────────
function toCarinaLines(label: string, detail: string | undefined, severity: Finding["severity"]): CarinaLine[] {
  const L = label;
  const out = (text: string, section?: "homepage" | "checkout"): CarinaLine[] => [{ severity, text, section }];

  // ─ Audit & CRO ─
  if (L === "Missing <title>") return out("Title missing.");
  if (/^<title> is short \((\d+) chars\)$/.test(L)) {
    return out(`Title short (${L.match(/\((\d+)/)?.[1]} chars).`);
  }
  if (L === "<title> present") return out("Title present.");
  if (L === "No <h1> on the page") return out("H1 missing.");
  if (/^Multiple <h1> tags \((\d+)\)$/.test(L)) {
    return out(`Multiple H1 tags detected (${L.match(/\((\d+)\)/)?.[1]}).`);
  }
  if (L === "Single <h1> as expected") return out("Single H1 detected.");
  if (/^(\d+) of (\d+) images missing alt text$/.test(L)) return out(`${L}.`);
  if (/^All (\d+) images have alt text$/.test(L)) {
    return out(`All ${L.match(/^All (\d+)/)?.[1]} images contain alt text.`);
  }
  if (L === "No obvious CTA detected") return out("No interactive CTA detected.");
  if (/^(\d+) interactive elements detected$/.test(L)) return out(`${L}.`);
  if (/^HTML payload is (\d+) KB$/.test(L)) {
    return out(`HTML payload ${L.match(/(\d+) KB/)?.[1]} KB.`);
  }
  if (/^HTML payload (\d+) KB · loaded in (\d+) ms$/.test(L)) {
    const m = L.match(/^HTML payload (\d+) KB · loaded in (\d+) ms$/);
    return [
      { severity, text: `HTML payload ${m?.[1]} KB.` },
      { severity, text: `Page loaded in ${m?.[2]} ms.` },
    ];
  }

  // ─ SEO / Technical ─
  if (L === "No meta description") return out("Meta description missing.");
  if (/^Meta description length \d+ \(50–160 recommended\)$/.test(L)) return out(`${L}.`);
  if (L === "Meta description present") return out("Meta description present.");
  if (L === "Open Graph tags missing or incomplete") {
    const hasImage = /og:image: yes/.test(detail ?? "");
    const hasTitle = /og:title: yes/.test(detail ?? "");
    return [
      { severity: hasImage ? "ok" : "warn", text: hasImage ? "Open Graph image present." : "Open Graph image missing." },
      { severity: hasTitle ? "ok" : "warn", text: hasTitle ? "Open Graph title present." : "Open Graph title missing." },
    ];
  }
  if (L === "Open Graph image + title present") {
    return [
      { severity: "ok", text: "Open Graph image present." },
      { severity: "ok", text: "Open Graph title present." },
    ];
  }
  if (/^Twitter card: /.test(L)) return out("Twitter card present.");
  if (L === "No Twitter card meta") return out("Twitter card missing.");
  if (/^(\d+) JSON-LD block\(s\) found$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} JSON-LD ${plural(n, "block")} detected.`);
  }
  if (L === "No structured data (JSON-LD)") return out("Structured data (JSON-LD) missing.");
  if (/^robots\.txt: (\d+)$/.test(L)) {
    return out(`robots.txt returns ${L.match(/(\d+)/)?.[1]}.`);
  }
  if (L === "robots.txt: unreachable") return out("robots.txt unreachable.");
  if (/^sitemap\.xml: (\d+)$/.test(L)) {
    return out(`sitemap.xml returns ${L.match(/(\d+)/)?.[1]}.`);
  }
  if (L === "sitemap.xml: unreachable") return out("sitemap.xml unreachable.");
  if (/^Checked (\d+) internal links — all OK$/.test(L)) {
    const n = Number(L.match(/^Checked (\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} internal ${plural(n, "link")} valid.`);
  }
  if (/^(\d+) of (\d+) sampled links broken$/.test(L)) return out(`${L}.`);

  // ─ Funnel / Payment ─
  if (/^Payment provider on homepage: /.test(L)) return out(`${L}.`);
  if (/^(\d+) checkout-style path\(s\) detected$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} checkout-style ${plural(n, "path")} detected.`);
  }
  if (L === "No checkout / cart / pricing path detected from the homepage") {
    return out("No checkout path detected on homepage.");
  }
  if (/^Checkout page reachable \(HTTP (\d+)\) · (\d+) ms$/.test(L)) {
    return out(`Checkout reachable (HTTP ${L.match(/HTTP (\d+)/)?.[1]}).`);
  }
  if (/^Checkout page returns (\d+)$/.test(L)) {
    return out(`Checkout returns HTTP ${L.match(/(\d+)/)?.[1]}.`);
  }
  if (/^Checkout page failed to fetch /.test(L)) return out("Checkout fetch failed.");
  if (L === "No payment provider script on the checkout page itself") {
    return [
      { severity, text: "No payment provider script detected." },
      { severity, text: "No Stripe, Swish, PayPal, Klarna, Shopify, or Adyen activity." },
    ];
  }
  if (/^Payment provider on checkout page: /.test(L)) {
    const provider = L.replace(/^Payment provider on checkout page: /, "");
    return out(`Payment provider detected: ${provider}.`);
  }
  if (L === "Stripe publishable key present") return out("Stripe publishable key present.");
  if (L === "Stripe expected but no publishable key found in checkout HTML") {
    return out("Stripe publishable key missing.");
  }
  if (/^Card input detected/.test(L)) return out("Card input detected.");
  if (L === "Stripe.js loaded but no card input on the page") {
    return out("Stripe.js loaded; no card form rendered.");
  }
  if (L === "No card form or Stripe iframe on checkout page") {
    return out("No card iframe rendered.");
  }
  if (/^(\d+) pay \/ order CTA\(s\) on checkout page$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} pay/order ${plural(n, "CTA")} on checkout page.`);
  }
  if (L === "No 'Pay' / 'Order' button visible on checkout page") {
    return out("No pay/order button rendered.");
  }
  if (L === "Visible error/unavailable text on checkout page") {
    return out("Visible error text on checkout.");
  }
  if (/^Trust signals: (\d+) \/ 5$/.test(L)) {
    return out(`Trust signals: ${L.match(/(\d+)/)?.[1]} of 5 present.`);
  }

  // ─ Email ─
  if (/^ESP detected: /.test(L)) return out(`${L}.`);
  if (L === "No common ESP script detected") return out("No ESP script detected.");
  if (/^(\d+) email signup form\(s\) on this page$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} signup ${plural(n, "form")} detected.`);
  }
  if (/^(\d+) email input\(s\) detected$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} email ${plural(n, "input")} detected.`);
  }
  if (L === "No email capture on this page") return out("No email capture detected.");
  if (/^(\d+) contact email address\(es\)$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} contact email ${plural(n, "address", "addresses")} present.`);
  }
  if (L === "No mailto: contact link found") return out("No mailto link detected.");
  if (L === "Privacy + cookie/consent references present") {
    return out("Privacy and consent indicators present.");
  }
  if (L === "Privacy or consent signals missing") {
    return out("Privacy and consent indicators missing.");
  }

  // ─ Social ─
  if (/^Site title:/.test(L)) return out("Title captured.");
  if (L === "Description captured") return out("Description captured.");
  if (/^No meta description for context/.test(L)) return out("Description missing.");
  if (L === "Drafted with Claude") return out("Draft posts generated.");
  if (/^LLM error:/.test(L) || /^ANTHROPIC_API_KEY not set/.test(L)) {
    return out("Draft posts generated using fallback templates.");
  }

  // ─ Synthetic browser check ─
  if (L === "Puppeteer could not launch a browser") {
    return out("Headless browser launch failed.");
  }
  if (L === "Homepage navigation failed in headless browser") {
    return out("Homepage navigation failed.", "homepage");
  }
  if (/^Homepage rendered in browser \((\d+) ms\)$/.test(L)) {
    return out(`Rendered in ${L.match(/(\d+) ms/)?.[1]} ms.`, "homepage");
  }
  if (/^(\d+) JavaScript error\(s\) on homepage$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} JavaScript ${plural(n, "error")}.`, "homepage");
  }
  if (L === "No JS errors on homepage") return out("No JavaScript errors.", "homepage");
  if (/^(\d+) failed network request\(s\) on homepage$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} failed network ${plural(n, "request")}.`, "homepage");
  }
  if (L === "No checkout path discovered in the rendered DOM") {
    return out("No checkout path discovered in rendered DOM.", "checkout");
  }
  if (L === "Checkout page failed to load in browser") {
    return out("Checkout failed to load.", "checkout");
  }
  if (/^Checkout page rendered in browser \(HTTP (\d+), (\d+) ms\)$/.test(L)) {
    const m = L.match(/HTTP (\d+), (\d+) ms/);
    return out(`Rendered in ${m?.[2]} ms (HTTP ${m?.[1]}).`, "checkout");
  }
  if (/^Stripe Elements iframe mounted/.test(L)) return out("Stripe Elements iframe mounted.", "checkout");
  if (L === "Stripe.js loaded but no Elements iframe mounted") {
    return out("Stripe.js loaded; no Elements iframe mounted.", "checkout");
  }
  if (L === "No Stripe activity in browser — likely broken integration") {
    return [
      { severity, text: "No payment provider initialization.", section: "checkout" },
      { severity, text: "No Stripe network calls observed.", section: "checkout" },
    ];
  }
  if (/^(\d+) pay\/order CTA\(s\) rendered in browser$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} pay/order ${plural(n, "CTA")} rendered.`, "checkout");
  }
  if (L === "No pay/order button rendered in browser") return out("No pay/order button rendered.", "checkout");
  if (/^(\d+) JavaScript error\(s\) on checkout page$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} JavaScript ${plural(n, "error")}.`, "checkout");
  }
  if (L === "No JS errors during checkout page load") {
    return out("No JavaScript errors.", "checkout");
  }
  if (/^(\d+) failed network request\(s\) on checkout$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} failed network ${plural(n, "request")}.`, "checkout");
  }
  if (/^(\d+) Stripe request\(s\) observed$/.test(L)) {
    const n = Number(L.match(/^(\d+)/)?.[1] ?? "0");
    return out(`${wordNum(n)} Stripe ${plural(n, "request")} observed.`, "checkout");
  }

  // Fallback
  return out(L.endsWith(".") ? L : `${L}.`);
}

function carinaScope(ch: Channel, run: Run): string {
  if (ch === "audit" || ch === "seo" || ch === "email" || ch === "social") {
    return "Homepage.";
  }
  if (ch === "deliverability") {
    const det = run.jobs.deliverability.result?.details as { domain?: string } | undefined;
    return det?.domain ? `DNS records of ${det.domain}.` : "Apex domain DNS.";
  }
  if (ch === "funnel") {
    const target = (run.jobs.funnel.result?.details as { targetCheckout?: string } | undefined)?.targetCheckout;
    if (target) {
      try {
        return `Checkout path: ${new URL(target).pathname}.`;
      } catch {
        return "Checkout path detected.";
      }
    }
    return "Homepage. No checkout path detected.";
  }
  if (ch === "browser") return "Homepage + Checkout.";
  return "";
}

// ── Cross-channel injection: Funnel pulls browser failed requests ───────
function funnelCrossChannelLines(run: Run): CarinaLine[] {
  const checkoutDetails = (run.jobs.browser.result?.details as
    | { checkout?: { failedRequests?: { url: string; status: number }[] } }
    | undefined)?.checkout;
  const failed = checkoutDetails?.failedRequests ?? [];
  if (failed.length === 0) return [];

  // Group: WP plugin 404s, admin-ajax, other status codes.
  const lines: CarinaLine[] = [];

  const plugin404s = failed.filter((r) => r.status === 404 && /\/wp-content\/plugins\//.test(r.url));
  if (plugin404s.length > 0) {
    lines.push({
      severity: "issue",
      text: `${wordNum(plugin404s.length)} plugin ${plural(plugin404s.length, "asset")} return 404.`,
    });
  }
  const adminAjax = failed.filter((r) => /admin-ajax\.php/.test(r.url));
  if (adminAjax.length > 0) {
    // Group by status code.
    const byStatus = new Map<number, number>();
    for (const r of adminAjax) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    for (const [status, count] of byStatus) {
      lines.push({
        severity: "issue",
        text: `${wordNum(count)} admin-ajax ${plural(count, "request")} return ${plural(count, `${status}`)}.`,
      });
    }
  }

  // Generic catch-all: anything not already covered, grouped by status code.
  const covered = new Set([...plugin404s, ...adminAjax]);
  const remaining = failed.filter((r) => !covered.has(r));
  if (remaining.length > 0) {
    const byStatus = new Map<number, number>();
    for (const r of remaining) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    for (const [status, count] of byStatus) {
      lines.push({
        severity: "issue",
        text: `${wordNum(count)} ${plural(count, "request")} return ${plural(count, `${status}`)}.`,
      });
    }
  }

  return lines;
}

// Social pulls Open Graph image status from SEO findings
function socialCrossChannelLines(run: Run): CarinaLine[] {
  const seoFindings = run.jobs.seo.result?.findings ?? [];
  for (const f of seoFindings) {
    if (f.label === "Open Graph tags missing or incomplete") {
      const hasImage = /og:image: yes/.test(f.detail ?? "");
      return [{
        severity: hasImage ? "ok" : "warn",
        text: hasImage ? "Open Graph image present." : "Open Graph image missing.",
      }];
    }
    if (f.label === "Open Graph image + title present") {
      return [{ severity: "ok", text: "Open Graph image present." }];
    }
  }
  return [];
}

// ── Score / status helpers ──────────────────────────────────────────────
function statusFor(score: number) {
  if (score >= 85) return { label: "HEALTHY", border: C.okBorder, bg: C.okSoft, fg: C.ok };
  if (score >= 60) return { label: "NEEDS WORK", border: C.warnBorder, bg: C.warnSoft, fg: C.warn };
  return { label: "CRITICAL ISSUES", border: C.dangerBorder, bg: C.dangerSoft, fg: C.danger };
}

function findingDot(severity: "ok" | "warn" | "issue") {
  if (severity === "ok") return { color: C.ok };
  if (severity === "warn") return { color: C.warn };
  return { color: C.danger };
}

// ── Required actions, derived per channel from finding labels ───────────
function actionsForChannel(ch: Channel, findings: Finding[], run: Run): string[] {
  const actions: string[] = [];
  const has = (re: RegExp) => findings.some((f) => re.test(f.label));

  if (ch === "audit") {
    if (has(/^Missing <title>$/)) actions.push("Add a title tag.");
    if (has(/^<title> is short/)) actions.push("Extend title to at least 10 characters.");
    if (has(/^No <h1> on the page$/)) actions.push("Add a single H1 tag.");
    if (has(/^Multiple <h1> tags/)) actions.push("Reduce to a single H1 tag.");
    if (has(/images missing alt text$/)) actions.push("Add alt text to remaining images.");
    if (has(/^No obvious CTA detected$/)) actions.push("Add a primary CTA element.");
    if (has(/^HTML payload is /)) actions.push("Reduce HTML payload below 1.5 MB.");
  }
  if (ch === "seo") {
    if (has(/^No meta description$/)) actions.push("Add a meta description.");
    if (has(/^Meta description length /)) actions.push("Adjust meta description length to 50–160 characters.");
    if (has(/^Open Graph tags missing/)) actions.push("Add missing Open Graph image.");
    if (has(/^No Twitter card meta$/)) actions.push("Add Twitter card meta tag.");
    if (has(/^No structured data/)) actions.push("Add JSON-LD structured data.");
    if (has(/^robots\.txt: (?!200$)/)) actions.push("Restore robots.txt.");
    if (has(/^sitemap\.xml: (?!200$)/)) actions.push("Restore sitemap.xml.");
    if (has(/sampled links broken$/)) actions.push("Fix broken internal links.");
  }
  if (ch === "funnel") {
    if (has(/^No checkout \/ cart \/ pricing path/)) actions.push("Add a discoverable checkout path from the homepage.");
    if (has(/^Checkout page returns /)) actions.push("Restore checkout page (non-2xx response).");
    if (has(/^Checkout page failed to fetch/)) actions.push("Restore checkout page reachability.");
    if (has(/^No payment provider script on the checkout/)) actions.push("Restore payment provider integration.");
    if (has(/^Stripe expected but no publishable key/)) actions.push("Add Stripe publishable key to checkout page.");
    if (has(/^Stripe\.js loaded but no card input/)) actions.push("Restore Stripe Elements rendering.");
    if (has(/^No 'Pay' \/ 'Order' button/)) actions.push("Confirm pay button renders after JS execution.");
    if (has(/^Visible error\/unavailable text/)) actions.push("Resolve visible error messages on checkout.");
    // Cross-channel actions from browser failures
    const checkoutFailed = (run.jobs.browser.result?.details as
      | { checkout?: { failedRequests?: { url: string; status: number }[] } }
      | undefined)?.checkout?.failedRequests ?? [];
    if (checkoutFailed.some((r) => r.status === 404 && /\/wp-content\/plugins\//.test(r.url))) {
      actions.push("Fix missing plugin assets.");
    }
    if (checkoutFailed.some((r) => r.status === 403 && /admin-ajax/.test(r.url))) {
      actions.push("Resolve 403 on admin-ajax.");
    }
  }
  if (ch === "email") {
    if (has(/^No common ESP script detected$/)) actions.push("Add ESP integration if email automation is required.");
    if (has(/^No email capture on this page$/)) actions.push("Add an email signup form.");
    if (has(/^No mailto: contact link found$/)) actions.push("Add mailto contact link.");
    if (has(/^Privacy or consent signals missing$/)) actions.push("Add privacy and consent indicators.");
  }
  if (ch === "deliverability") {
    if (has(/^No SPF record$/)) actions.push("Add SPF record.");
    if (has(/^SPF present but weak policy/)) actions.push("Tighten SPF terminating mechanism to ~all or -all.");
    if (has(/^SPF has \d+ include lookups$/)) actions.push("Reduce SPF include lookups below 10.");
    if (has(/^No DMARC record$/)) actions.push("Add DMARC record (start at p=none for monitoring).");
    if (has(/^DMARC policy: p=none/)) actions.push("Promote DMARC policy to p=quarantine after the monitoring period.");
    if (has(/^DMARC record present but policy not set$/)) actions.push("Set DMARC policy (p=none, p=quarantine, or p=reject).");
    if (has(/^No DKIM found at common selectors$/)) actions.push("Configure DKIM signing on the sending mail server.");
    if (has(/^No MX records/)) actions.push("Add MX records.");
    if (has(/^No MTA-STS record$/)) actions.push("Add MTA-STS record and policy file.");
    if (has(/^SPF-listed IP .* has no PTR record$/)) actions.push("Add PTR (reverse DNS) records for SPF-authorized IPs.");
  }
  if (ch === "social") {
    if (has(/^No meta description for context/)) actions.push("Add a meta description.");
    // Cross-channel: Open Graph image missing in SEO findings
    const seoFindings = run.jobs.seo.result?.findings ?? [];
    const ogIssue = seoFindings.find((f) => f.label === "Open Graph tags missing or incomplete");
    if (ogIssue && !/og:image: yes/.test(ogIssue.detail ?? "")) {
      actions.push("Add Open Graph image.");
    }
  }
  if (ch === "browser") {
    if (has(/^Homepage navigation failed/)) actions.push("Restore homepage reachability in browser.");
    if (has(/JavaScript error\(s\) on (homepage|checkout)/)) actions.push("Resolve JavaScript errors.");
    if (has(/failed network request\(s\) on (homepage|checkout)/)) actions.push("Fix failed network requests.");
    if (has(/^No checkout path discovered in the rendered DOM$/)) actions.push("Surface a checkout path from the homepage DOM.");
    if (has(/^Checkout page failed to load in browser$/)) actions.push("Restore checkout page reachability.");
    if (has(/^No Stripe activity in browser/)) actions.push("Restore payment provider scripts on checkout.");
    if (has(/^Stripe\.js loaded but no Elements iframe/)) actions.push("Restore Stripe Elements rendering on checkout.");
    if (has(/^No pay\/order button rendered in browser$/)) actions.push("Confirm pay button renders after JS execution.");
  }

  return actions;
}

// ── Overall result + final summary ──────────────────────────────────────
function buildOverallResult(run: Run): string {
  const funnelIssues = (run.jobs.funnel.result?.findings ?? []).filter((f) => f.severity === "issue").length;
  const browserIssues = (run.jobs.browser.result?.findings ?? []).filter((f) => f.severity === "issue").length;
  const all = channels.flatMap((ch) => run.jobs[ch].result?.findings ?? []);
  const total = all.filter((f) => f.severity === "issue").length;
  if (total === 0) return "Site loads. No critical findings.";
  if (funnelIssues > 0 || browserIssues > 0) return "Site loads. Checkout is non-functional.";
  return `Site loads. ${total} critical finding${total > 1 ? "s" : ""} identified.`;
}

function buildSummary(run: Run): string[] {
  const funnelIssues = (run.jobs.funnel.result?.findings ?? []).filter((f) => f.severity === "issue").length;
  const browserIssues = (run.jobs.browser.result?.findings ?? []).filter((f) => f.severity === "issue").length;
  const criticalChannels: string[] = [];
  for (const ch of channels) {
    const issues = (run.jobs[ch].result?.findings ?? []).filter((f) => f.severity === "issue");
    if (issues.length > 0) criticalChannels.push(channelLabels[ch]);
  }
  if (criticalChannels.length === 0) {
    return ["All checked paths return expected responses.", "No action required."];
  }
  if (funnelIssues > 0 || browserIssues > 0) {
    return [
      "Checkout is non-functional.",
      "No payment provider loads.",
      "No pay button renders.",
      "Payment integration must be restored before the site can process orders.",
    ];
  }
  return [
    `Critical findings identified in: ${criticalChannels.join(", ")}.`,
    "Operator review required.",
  ];
}

// ── Score ring ──────────────────────────────────────────────────────────
function ScoreCircle({
  score,
  max = 100,
  size = 92,
  stroke = 7,
}: {
  score: number;
  max?: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (score / max);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cy} r={r} stroke={C.primarySoft} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={C.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", color: C.text }}>{score}</Text>
      <Text style={{ fontSize: 7, color: C.muted, marginTop: 1 }}>{`/ ${max}`}</Text>
    </View>
  );
}

// ── Layout pieces ───────────────────────────────────────────────────────
function HeaderPill({ score }: { score: number }) {
  const s = statusFor(score);
  return (
    <View style={styles.pillRow}>
      <View
        style={[styles.pill, { borderColor: s.border, backgroundColor: s.bg }] as never}
      >
        <Text style={[styles.pillText, { color: s.fg }] as never}>✓  {s.label}</Text>
      </View>
    </View>
  );
}

function Hero({ run, overallScore }: { run: Run; overallScore: number }) {
  const completed = channels
    .map((ch) => run.jobs[ch])
    .filter((j) => j.status === "done" || j.status === "failed");
  const allFindings = completed.flatMap((j) => j.result?.findings ?? []);
  const issues = allFindings.filter((f) => f.severity === "issue").length;
  const warns = allFindings.filter((f) => f.severity === "warn").length;
  const oks = allFindings.filter((f) => f.severity === "ok").length;
  const date = new Date(run.createdAt).toISOString().split("T")[0];

  return (
    <View style={styles.hero}>
      <View style={styles.heroLeft}>
        <Text style={styles.h1}>{run.hostname} — Communications Intelligence Report</Text>
        <Text style={styles.sub}>
          {date} · {completed.length} channels analyzed · {issues} critical · {warns} watch · {oks} pass
        </Text>
        <Text style={[styles.sub, { marginTop: 8 }] as never}>
          Run ID: {run.id}
        </Text>
      </View>
      <ScoreCircle score={overallScore} />
    </View>
  );
}

function OverallResult({ run, carina }: { run: Run; carina?: CarinaRewrite }) {
  const text = carina?.overall_result || buildOverallResult(run);
  return (
    <View style={styles.overallBlock}>
      <Text style={styles.overallLabel}>Overall result</Text>
      <Text style={styles.overallText}>{text}</Text>
    </View>
  );
}

function ChannelKpis({ run }: { run: Run }) {
  return (
    <View style={styles.kpiRow}>
      {channels.map((ch) => {
        const job = run.jobs[ch];
        const score = job.result?.score;
        const isDone = job.status === "done";
        return (
          <View key={ch} style={styles.kpi}>
            <Text style={styles.kpiLabel}>{channelLabels[ch]}</Text>
            <Text style={styles.kpiValue}>{isDone && score !== undefined ? score : "—"}</Text>
            <Text style={styles.kpiSub}>
              {isDone
                ? `${job.result?.findings.length ?? 0} finding(s)`
                : job.status === "failed"
                  ? "failed"
                  : job.status}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function FindingBullet({ line }: { line: CarinaLine }) {
  const d = findingDot(line.severity);
  return (
    <View style={styles.findingRow}>
      <Text style={[styles.findingDot, { color: d.color }] as never}>●</Text>
      <Text style={styles.findingText}>{line.text}</Text>
    </View>
  );
}

function findCarinaChannel(carina: CarinaRewrite | undefined, ch: Channel) {
  if (!carina) return undefined;
  const target = channelLabels[ch];
  return carina.channels.find((c) => c.name === target || c.name === ch);
}

function ChannelSection({
  ch,
  job,
  run,
  carina,
}: {
  ch: Channel;
  job: Job;
  run: Run;
  carina?: CarinaRewrite;
}) {
  const findings = job.result?.findings ?? [];
  const carinaCh = findCarinaChannel(carina, ch);

  // Findings: prefer Gemini-rewritten lines; fall back to template transform.
  let lineTexts: string[];
  let lineSeverities: Finding["severity"][];
  if (carinaCh) {
    lineTexts = carinaCh.findings;
    lineSeverities = lineTexts.map(() => "ok");
    // Restore severities by index where the original findings still exist
    for (let i = 0; i < lineTexts.length && i < findings.length; i++) {
      lineSeverities[i] = findings[i].severity;
    }
  } else {
    const lines: CarinaLine[] = [];
    for (const f of findings) {
      for (const line of toCarinaLines(f.label, f.detail, f.severity)) {
        lines.push(line);
      }
    }
    if (ch === "funnel") {
      lines.push(...funnelCrossChannelLines(run));
      const hasCritical = findings.some((f) => f.severity === "issue") ||
        (run.jobs.browser.result?.findings ?? []).some((f) =>
          f.severity === "issue" && /payment|stripe|pay.order|checkout/i.test(f.label));
      if (hasCritical && job.result) {
        lines.push({ severity: "issue", text: "Checkout cannot process transactions." });
      }
    }
    if (ch === "social") {
      lines.push(...socialCrossChannelLines(run));
    }
    lineTexts = lines.map((l) => l.text);
    lineSeverities = lines.map((l) => l.severity);
  }

  const actions = carinaCh ? carinaCh.required_actions : actionsForChannel(ch, findings, run);
  const scopeText = carinaCh ? carinaCh.scope : carinaScope(ch, run);
  const scoreText = carinaCh ? carinaCh.score : job.result ? String(job.result.score) : "";

  return (
    <View style={styles.channelBlock} wrap={true}>
      <View style={styles.channelHead}>
        <Text style={styles.channelTitle}>
          {channelLabels[ch]}
          {scoreText ? ` — ${scoreText}` : ""}
        </Text>
      </View>
      {job.status === "failed" && (
        <Text style={[styles.channelScope, { color: C.danger }] as never}>
          Job failed: {job.error}
        </Text>
      )}

      {job.result && (
        <>
          <Text style={styles.fieldLabel}>Scope</Text>
          <Text style={styles.fieldValue}>{scopeText}</Text>

          <Text style={styles.fieldLabel}>Findings</Text>
          {ch === "browser" && !carinaCh ? (
            <BrowserFindings
              lines={lineTexts.map((text, i) => ({
                severity: lineSeverities[i] ?? "ok",
                text,
              }))}
            />
          ) : (
            lineTexts.map((text, i) => (
              <FindingBullet
                key={i}
                line={{ severity: lineSeverities[i] ?? "ok", text }}
              />
            ))
          )}

          <Text style={styles.fieldLabel}>Required Action</Text>
          {actions.length === 0 ? (
            <View style={styles.actionRow}>
              <Text style={styles.actionDot}>•</Text>
              <Text style={styles.actionText}>None.</Text>
            </View>
          ) : (
            actions.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.actionDot}>•</Text>
                <Text style={styles.actionText}>{a}</Text>
              </View>
            ))
          )}

          {ch === "deliverability" && <DeliverabilityFixIt details={job.result.details} />}
        </>
      )}
    </View>
  );
}

type DnsRecommendation = {
  kind: "TXT" | "PTR" | "FILE";
  host: string;
  value: string;
  rationale: string;
};

function DeliverabilityFixIt({ details }: { details: unknown }) {
  const records =
    ((details as { recommendedRecords?: DnsRecommendation[] } | null | undefined)
      ?.recommendedRecords) ?? [];
  if (records.length === 0) return null;
  return (
    <>
      <Text style={styles.fieldLabel}>Recommended DNS additions</Text>
      {records.map((r, i) => (
        <View key={i} style={styles.fixitBlock} wrap={false}>
          <Text style={styles.fixitKind}>
            {r.kind}   {r.host}
          </Text>
          <Text style={styles.fixitRecord}>{r.value}</Text>
          <Text style={styles.fixitRationale}>{r.rationale}</Text>
        </View>
      ))}
    </>
  );
}

function BrowserFindings({ lines }: { lines: CarinaLine[] }) {
  const homepage = lines.filter((l) => l.section === "homepage");
  const checkout = lines.filter((l) => l.section === "checkout");
  const other = lines.filter((l) => !l.section);
  return (
    <>
      {other.map((line, i) => <FindingBullet key={`o${i}`} line={line} />)}
      {homepage.length > 0 && (
        <>
          <Text style={styles.subHead}>Homepage:</Text>
          {homepage.map((line, i) => <FindingBullet key={`h${i}`} line={line} />)}
        </>
      )}
      {checkout.length > 0 && (
        <>
          <Text style={styles.subHead}>Checkout:</Text>
          {checkout.map((line, i) => <FindingBullet key={`c${i}`} line={line} />)}
        </>
      )}
    </>
  );
}

function Summary({ run, carina }: { run: Run; carina?: CarinaRewrite }) {
  const lines = carina?.summary && carina.summary.length > 0 ? carina.summary : buildSummary(run);
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>Summary</Text>
      {lines.map((l, i) => (
        <Text key={i} style={styles.summaryText}>{l}</Text>
      ))}
    </View>
  );
}

function AuditTrail({ run, carina }: { run: Run; carina?: CarinaRewrite }) {
  if (carina?.audit_trail) {
    return (
      <View style={styles.audit}>
        <Text style={styles.auditLabel}>Audit trail</Text>
        <Text style={styles.auditText}>{carina.audit_trail}</Text>
      </View>
    );
  }
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  return (
    <View style={styles.audit}>
      <Text style={styles.auditLabel}>Audit trail</Text>
      <Text style={styles.auditText}>Generated by Pam on {ts} UTC.</Text>
      <Text style={styles.auditText}>Run identifier: {run.id}.</Text>
      <Text style={styles.auditText}>Findings derived from automated scan.</Text>
      <Text style={styles.auditText}>Operator review recommended before external use.</Text>
    </View>
  );
}

function Footer() {
  return (
    <Text style={styles.footer}>
      Communications Intelligence Platform — structured, repeatable checks.
    </Text>
  );
}

// ── Document ────────────────────────────────────────────────────────────
function HealthReport({ run, carina }: { run: Run; carina?: CarinaRewrite }) {
  const completed = channels
    .map((ch) => run.jobs[ch])
    .filter((j) => j.status === "done" && j.result);
  const overallScore =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((s, j) => s + (j.result?.score ?? 0), 0) /
            completed.length
        );

  return (
    <Document
      title={`Communications Intelligence Report — ${run.customer}`}
      author="Communications Intelligence Platform"
      subject={`Communications intelligence report for ${run.url}`}
    >
      {/* PAGE 1 — Title, subtext, score, overall result */}
      <Page size="A4" style={styles.page}>
        <HeaderPill score={overallScore} />
        <Hero run={run} overallScore={overallScore} />
        <OverallResult run={run} carina={carina} />
      </Page>

      {/* PAGE 2 — Channel scores table */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHead}>Channel scores</Text>
        <ChannelKpis run={run} />
      </Page>

      {/* PAGE 3+ — Channel findings */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHead}>Channel findings</Text>
        {channels.slice(0, 4).map((ch) => (
          <ChannelSection key={ch} ch={ch} job={run.jobs[ch]} run={run} carina={carina} />
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHead}>Channel findings (continued)</Text>
        {channels.slice(4).map((ch) => (
          <ChannelSection key={ch} ch={ch} job={run.jobs[ch]} run={run} carina={carina} />
        ))}
      </Page>

      {/* Final page — Summary, Audit trail, Footer */}
      <Page size="A4" style={styles.page}>
        <Summary run={run} carina={carina} />
        <AuditTrail run={run} carina={carina} />
        <Footer />
      </Page>
    </Document>
  );
}

export async function renderHealthReportPdf(
  run: Run,
  carina?: CarinaRewrite
): Promise<Buffer> {
  return await renderToBuffer(<HealthReport run={run} carina={carina} />);
}
