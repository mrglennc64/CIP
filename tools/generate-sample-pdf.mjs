// Generates the rich sample weekly Communications Intelligence Report PDF.
// Layout mirrors a polished compliance-report style: status pill, score
// circle, KPI tiles, validation checks, per-site status table, audit trail.
// Run with: node tools/generate-sample-pdf.mjs
import { createElement as h } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Svg,
  Circle,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "public", "reports", "sample-report.pdf");

// --- Tokens ---
const C = {
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#ffffff",
  bg: "#f7f9fb",
  primary: "#1f6feb",
  primarySoft: "#e3edff",
  success: "#16a34a",
  successSoft: "#dcfce7",
  successBorder: "#bbf7d0",
  warn: "#ca8a04",
  danger: "#dc2626",
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
  // Header pill
  pillRow: { flexDirection: "row", marginBottom: 14 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.successBorder,
    backgroundColor: C.successSoft,
  },
  pillText: { fontSize: 9, color: C.success, fontFamily: "Helvetica-Bold" },

  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 6 },
  sub: { fontSize: 10, color: C.muted, lineHeight: 1.45 },

  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 14,
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  heroLeft: { flex: 1 },

  // Section label
  sectionLabel: {
    fontSize: 10,
    color: C.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  // Score change strip
  scoreStrip: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreBefore: { fontSize: 10, color: C.text, marginBottom: 3 },
  scoreAfter: { fontSize: 10, color: C.text },
  scoreNote: { fontSize: 9, color: C.success, fontFamily: "Helvetica-Bold" },

  // KPI row
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  kpi: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    minHeight: 70,
  },
  kpiLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text },
  kpiSub: { fontSize: 8, color: C.success, marginTop: 4 },

  // Section header
  sectionHead: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 10,
  },

  // Applied tile (smaller variant of KPI)
  appliedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  appliedTile: {
    width: "48%",
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
  },
  appliedNumber: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.text },
  appliedLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text, marginTop: 4 },
  appliedDesc: { fontSize: 8, color: C.muted, marginTop: 2 },

  // Validation checks
  checksBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 18,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  checkRowFirst: { borderTopWidth: 0 },
  checkMark: {
    width: 14,
    fontSize: 11,
    color: C.success,
    fontFamily: "Helvetica-Bold",
  },
  checkLabel: { flex: 1, fontSize: 9.5, color: C.text },
  checkPass: { fontSize: 9, color: C.success, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  // Table
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 18,
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  trFirst: { borderTopWidth: 0 },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  td: { fontSize: 9.5, color: C.text },
  tdMuted: { fontSize: 9, color: C.muted },
  cNum: { width: 24 },
  cSite: { width: 130 },
  cStatus: { width: 70 },
  cChange: { flex: 1 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.successBorder,
    backgroundColor: C.successSoft,
    alignSelf: "flex-start",
  },
  statusPillText: { fontSize: 8, color: C.success, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  // Ready callout
  ready: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  readyIcon: { fontSize: 16, color: C.success },
  readyTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.text },
  readyText: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },

  // Audit
  audit: {
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
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

// --- Score circle (SVG) ---
function ScoreCircle({ score = 98, max = 100, size = 90, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  return h(
    View,
    { style: { width: size, height: size, alignItems: "center", justifyContent: "center" } },
    h(
      Svg,
      { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { position: "absolute" } },
      h(Circle, { cx, cy, r, stroke: C.primarySoft, strokeWidth: stroke, fill: "none" }),
      h(Circle, { cx, cy, r, stroke: C.primary, strokeWidth: stroke, fill: "none", strokeDasharray: `${2 * Math.PI * r * (score / max)} ${2 * Math.PI * r}`, strokeLinecap: "round", transform: `rotate(-90 ${cx} ${cy})` })
    ),
    h(Text, { style: { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.text } }, String(score)),
    h(Text, { style: { fontSize: 7, color: C.muted, marginTop: 1 } }, `/ ${max}`)
  );
}

// --- Sample report content (for "Week 20" weekly assessment) ---
const kpis = [
  { label: "Sites scanned", value: "6", sub: "across 3 plans" },
  { label: "Clean", value: "6", sub: "100% of monitored" },
  { label: "Improvements shipped", value: "4", sub: "all live in production" },
  { label: "Outstanding issues", value: "0", sub: "ready for next cycle" },
];

const applied = [
  { n: 2, title: "Payment A/B tests concluded", desc: "Variant B rolled to 100% on nordicpay.se (+4.1%)" },
  { n: 1, title: "Broken link fixed", desc: "helsinki-shop.fi/products/old-promo" },
  { n: 3, title: "Email triggers verified", desc: "Onboarding sequence E1–E3 latency confirmed" },
  { n: 4, title: "Metadata updates approved", desc: "copenhagen-tech.dk pages refreshed" },
  { n: 1, title: "Hero copy rewritten", desc: "stockholm-fitness.se /home — clarity pass" },
  { n: 2, title: "Social posts published", desc: "Week 20 platform-ready content" },
];

const checks = [
  "Site availability — all 6 sites responding under 1s",
  "Content drift — no unexpected page changes",
  "Broken links — 1 found and fixed",
  "Payment flow — checkout end-to-end smoke test green",
  "Email triggers — onboarding sequence delivers in <30s",
  "Mobile layout — no overflow on test devices",
  "Trust signals — privacy, terms, contact present",
  "SEO basics — title, description, OG image present",
];

const sites = [
  { n: 1, site: "nordicpay.se", change: "A/B variant B rolled to 100% · +4.1% conversion" },
  { n: 2, site: "helsinki-shop.fi", change: "Broken link /products/old-promo fixed" },
  { n: 3, site: "copenhagen-tech.dk", change: "Metadata refresh on 4 pages" },
  { n: 4, site: "aurora-saas.com", change: "Email trigger E3 latency under threshold" },
  { n: 5, site: "stockholm-fitness.se", change: "Hero copy rewritten on /home" },
  { n: 6, site: "gothenburg-clinic.se", change: "No changes — monitored only" },
];

// --- Composition helpers ---
const Pill = () =>
  h(
    View,
    { style: styles.pillRow },
    h(
      View,
      { style: styles.pill },
      h(Text, { style: styles.pillText }, "✓  HEALTHY")
    )
  );

const Hero = () =>
  h(
    View,
    { style: styles.hero },
    h(
      View,
      { style: styles.heroLeft },
      h(Text, { style: styles.h1 }, "Week 20 — All Channels Reviewed"),
      h(
        Text,
        { style: styles.sub },
        "6 sites scanned · 0 critical issues · 4 improvements shipped · 2 A/B tests concluded. Catalog is in a clean state and ready for the next cycle."
      )
    ),
    h(ScoreCircle, { score: 98, max: 100, size: 84 })
  );

const ScoreStrip = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionLabel }, "Score change"),
    h(
      View,
      { style: styles.scoreStrip },
      h(
        Text,
        { style: styles.scoreBefore },
        h(Text, { style: { fontFamily: "Helvetica-Bold" } }, "Last week: "),
        "92 / 100 — 3 issues open, 1 conversion regression flagged."
      ),
      h(
        Text,
        { style: styles.scoreAfter },
        h(Text, { style: { fontFamily: "Helvetica-Bold", color: C.success } }, "This week: "),
        "98 / 100 — all issues resolved. ",
        h(Text, { style: styles.scoreNote }, "+6 points · 0 outstanding")
      )
    )
  );

const KPIs = () =>
  h(
    View,
    { style: styles.kpiRow },
    ...kpis.map((k) =>
      h(
        View,
        { key: k.label, style: styles.kpi },
        h(Text, { style: styles.kpiLabel }, k.label),
        h(Text, { style: styles.kpiValue }, k.value),
        h(Text, { style: styles.kpiSub }, k.sub)
      )
    )
  );

const Applied = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "1.  What was applied"),
    h(
      Text,
      { style: { ...styles.sub, marginBottom: 10 } },
      "Each change was confirmed with the tenant before publishing."
    ),
    h(
      View,
      { style: styles.appliedGrid },
      ...applied.map((a, i) =>
        h(
          View,
          { key: i, style: styles.appliedTile },
          h(Text, { style: styles.appliedNumber }, String(a.n)),
          h(Text, { style: styles.appliedLabel }, a.title),
          h(Text, { style: styles.appliedDesc }, a.desc)
        )
      )
    )
  );

const Checks = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "2.  Validation checks"),
    h(
      View,
      { style: styles.checksBox },
      ...checks.map((c, i) =>
        h(
          View,
          {
            key: i,
            style: i === 0 ? { ...styles.checkRow, ...styles.checkRowFirst } : styles.checkRow,
          },
          h(Text, { style: styles.checkMark }, "✓"),
          h(Text, { style: styles.checkLabel }, c),
          h(Text, { style: styles.checkPass }, "PASS")
        )
      )
    )
  );

const SitesTable = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "3.  Per-site status"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.cNum } }, "#"),
        h(Text, { style: { ...styles.th, ...styles.cSite } }, "Site"),
        h(Text, { style: { ...styles.th, ...styles.cStatus } }, "Status"),
        h(Text, { style: { ...styles.th, ...styles.cChange } }, "Change")
      ),
      ...sites.map((s) =>
        h(
          View,
          { key: s.n, style: styles.tr },
          h(Text, { style: { ...styles.tdMuted, ...styles.cNum } }, String(s.n)),
          h(Text, { style: { ...styles.td, ...styles.cSite, fontFamily: "Helvetica-Bold" } }, s.site),
          h(
            View,
            { style: styles.cStatus },
            h(
              View,
              { style: styles.statusPill },
              h(Text, { style: styles.statusPillText }, "CLEAN")
            )
          ),
          h(Text, { style: { ...styles.tdMuted, ...styles.cChange } }, s.change)
        )
      )
    )
  );

const Ready = () =>
  h(
    View,
    { style: styles.ready },
    h(Text, { style: styles.readyIcon }, "✓"),
    h(
      View,
      { style: { flex: 1 } },
      h(Text, { style: styles.readyTitle }, "Ready for next cycle"),
      h(
        Text,
        { style: styles.readyText },
        "All 6 sites passed availability, content, payment, email, mobile, trust, and SEO checks. No outstanding issues. Daily crawl continues — next weekly report is automated for Friday 09:00."
      )
    )
  );

const Audit = () =>
  h(
    View,
    { style: styles.audit },
    h(Text, { style: styles.auditLabel }, "Audit trail"),
    h(
      Text,
      { style: styles.auditText },
      "All 13 changes in this report were confirmed by the tenant via the corrections worksheet on 2026-05-16. The tenant retains full ownership of every decision; Pam only applied what was explicitly approved."
    )
  );

const Footer = () =>
  h(
    Text,
    { style: styles.footer },
    "Communications Intelligence Platform · cip.usesmpt.com · Generated by Pam — sample weekly report"
  );

const Doc = () =>
  h(
    Document,
    {
      title: "Weekly Communications Intelligence Report — Week 20",
      author: "Communications Intelligence Platform",
      subject: "Sample weekly report",
    },
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Pill),
      h(Hero),
      h(ScoreStrip),
      h(KPIs),
      h(Applied)
    ),
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Checks),
      h(SitesTable),
      h(Ready),
      h(Audit),
      h(Footer)
    )
  );

mkdirSync(dirname(outPath), { recursive: true });
await renderToFile(h(Doc), outPath);
console.log(`Wrote ${outPath}`);
