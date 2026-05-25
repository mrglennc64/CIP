// English Before/After report — structured PDF.
// Run with: node tools/generate-before-after-pdf.mjs
import { createElement as h } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "public", "reports", "sample-before-after.pdf");

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
  warnSoft: "#fef3c7",
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
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 6 },
  sub: { fontSize: 10, color: C.muted, lineHeight: 1.45 },

  hero: {
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginBottom: 18,
  },

  sectionHead: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 14,
    marginBottom: 10,
  },

  baCardRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  baCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  baCardBefore: { backgroundColor: C.dangerSoft, borderColor: C.dangerBorder },
  baCardAfter: { backgroundColor: C.successSoft, borderColor: C.successBorder },
  baCardDelta: { backgroundColor: C.primarySoft, borderColor: C.primarySoft },
  baLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  baLine: { fontSize: 9.5, color: C.text, marginBottom: 3, lineHeight: 1.4 },
  baStrong: { fontFamily: "Helvetica-Bold" },

  statusGroup: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  statusRowFirst: { borderTopWidth: 0 },
  statusHead: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 3,
  },
  statusText: { fontSize: 9, color: C.muted, lineHeight: 1.4 },

  appliedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
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
  tdGreen: { fontSize: 9.5, color: C.success, fontFamily: "Helvetica-Bold" },

  mLabel: { flex: 1.6 },
  mBefore: { width: 70 },
  mAfter: { width: 70 },
  mDelta: { width: 80 },

  sSite: { width: 130 },
  sBefore: { width: 70 },
  sAfter: { width: 70 },
  sComment: { flex: 1 },

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

  statusPillSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusPillSmText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
});

const before = {
  score: 78,
  issues: 11,
  risks: 4,
  conversion: 2.3,
  contentIssues: "Unclear hero copy on 3 pages · missing CTA on /pricing",
  paymentIssues: "Checkout bounce 18% above average · Variant A underperforming",
  emailIssues: "Sequence E3 latency over 60s · 2 onboarding emails missing link",
  techIssues: "1 broken link in transactional email · 404 for 12 days",
  trustIssues: "No visible privacy link on /payment",
  seoIssues: "Title missing on 4 pages · OG image missing on /home",
};

const after = {
  score: 98,
  issues: 0,
  risks: 0,
  conversion: 6.4,
  contentStatus: "Hero copy rewritten · CTA added",
  paymentStatus: "Variant B rolled to 100% (+4.1% conversion)",
  emailStatus: "E1–E3 latency under 30s · sequence verified",
  techStatus: "404 link removed · no errors remaining",
  trustStatus: "Privacy link visible on all flows",
  seoStatus: "Title, description, OG image on all pages",
};

const delta = {
  score: after.score - before.score,
  conversion: +(after.conversion - before.conversion).toFixed(1),
  issues: after.issues - before.issues,
  brokenLinks: -1,
  metadata: -4,
};

const changes = [
  { n: 1, title: "A/B variant B rolled to 100%", desc: "+4.1% conversion · 95% statistical confidence" },
  { n: 2, title: "Broken link fixed", desc: "/products/old-promo removed from transactional email" },
  { n: 3, title: "Metadata updated", desc: "Title, description, OG image on 4 pages" },
  { n: 4, title: "Hero copy rewritten", desc: "/home — clarity pass" },
  { n: 5, title: "Email sequence verified", desc: "E1–E3 latency under 30s" },
  { n: 6, title: "Social posts published", desc: "Week 20 — platform-ready content" },
];

const siteRows = [
  { site: "nordicpay.se", before: "Watch", after: "Clean", comment: "A/B variant B rolled" },
  { site: "helsinki-shop.fi", before: "Issues", after: "Clean", comment: "Broken link fixed" },
  { site: "copenhagen-tech.dk", before: "Watch", after: "Clean", comment: "Metadata updated" },
  { site: "aurora-saas.com", before: "Watch", after: "Clean", comment: "Trigger E3 OK" },
  { site: "stockholm-fitness.se", before: "Drift", after: "Stable", comment: "Hero copy rewritten" },
  { site: "gothenburg-clinic.se", before: "Clean", after: "Clean", comment: "No change" },
];

const Hero = () =>
  h(
    View,
    { style: styles.hero },
    h(Text, { style: styles.h1 }, "Before/After Report — Week 20"),
    h(
      Text,
      { style: styles.sub },
      "6 sites reviewed · 0 critical issues · 4 improvements shipped. Report shows measurable changes before and after applied actions."
    )
  );

const Summary = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "1.  Summary"),
    h(
      View,
      { style: styles.baCardRow },
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardBefore } },
        h(Text, { style: styles.baLabel }, "Before"),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Score: "), `${before.score} / 100`),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Open issues: "), String(before.issues)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Risks: "), String(before.risks)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Conversion: "), `${before.conversion}%`)
      ),
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardAfter } },
        h(Text, { style: styles.baLabel }, "After"),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Score: "), `${after.score} / 100`),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Open issues: "), String(after.issues)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Resolved: "), String(before.risks)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Conversion: "), `${after.conversion}%`)
      ),
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardDelta } },
        h(Text, { style: styles.baLabel }, "Change"),
        h(Text, { style: styles.baLine }, `+${delta.score} points`),
        h(Text, { style: styles.baLine }, `+${delta.conversion}% conversion`),
        h(Text, { style: styles.baLine }, `${Math.abs(delta.issues)} issues resolved`),
        h(Text, { style: styles.baLine }, "All risks addressed")
      )
    )
  );

function StatusGroup({ title, items }) {
  return h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, title),
    h(
      View,
      { style: styles.statusGroup },
      ...items.map((it, i) =>
        h(
          View,
          { key: i, style: i === 0 ? { ...styles.statusRow, ...styles.statusRowFirst } : styles.statusRow },
          h(Text, { style: styles.statusHead }, it.head),
          h(Text, { style: styles.statusText }, it.text)
        )
      )
    )
  );
}

const BeforeStatus = () =>
  h(StatusGroup, {
    title: "2.  Before state",
    items: [
      { head: "Structure & content", text: before.contentIssues },
      { head: "Payment flow", text: before.paymentIssues },
      { head: "Email & automation", text: before.emailIssues },
      { head: "Technical errors", text: before.techIssues },
      { head: "Trust signals", text: before.trustIssues },
      { head: "SEO basics", text: before.seoIssues },
    ],
  });

const Applied = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "3.  Applied changes"),
    h(
      Text,
      { style: { ...styles.sub, marginBottom: 10 } },
      "Each change was confirmed with the tenant before publishing."
    ),
    h(
      View,
      { style: styles.appliedGrid },
      ...changes.map((c, i) =>
        h(
          View,
          { key: i, style: styles.appliedTile },
          h(Text, { style: styles.appliedNumber }, String(c.n)),
          h(Text, { style: styles.appliedLabel }, c.title),
          h(Text, { style: styles.appliedDesc }, c.desc)
        )
      )
    )
  );

const AfterStatus = () =>
  h(StatusGroup, {
    title: "4.  After state",
    items: [
      { head: "Structure & content", text: after.contentStatus },
      { head: "Payment flow", text: after.paymentStatus },
      { head: "Email & automation", text: after.emailStatus },
      { head: "Technical errors", text: after.techStatus },
      { head: "Trust signals", text: after.trustStatus },
      { head: "SEO basics", text: after.seoStatus },
    ],
  });

const Metrics = () => {
  const rows = [
    { label: "Score", before: String(before.score), after: String(after.score), delta: `+${delta.score}` },
    { label: "Conversion", before: `${before.conversion}%`, after: `${after.conversion}%`, delta: `+${delta.conversion}%` },
    { label: "Open issues", before: String(before.issues), after: String(after.issues), delta: String(delta.issues) },
    { label: "Broken links", before: "1", after: "0", delta: String(delta.brokenLinks) },
    { label: "Metadata errors", before: "4", after: "0", delta: String(delta.metadata) },
  ];
  return h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "5.  Measurable improvements"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.mLabel } }, "Metric"),
        h(Text, { style: { ...styles.th, ...styles.mBefore } }, "Before"),
        h(Text, { style: { ...styles.th, ...styles.mAfter } }, "After"),
        h(Text, { style: { ...styles.th, ...styles.mDelta } }, "Change")
      ),
      ...rows.map((r, i) =>
        h(
          View,
          { key: i, style: styles.tr },
          h(Text, { style: { ...styles.td, ...styles.mLabel, fontFamily: "Helvetica-Bold" } }, r.label),
          h(Text, { style: { ...styles.tdMuted, ...styles.mBefore } }, r.before),
          h(Text, { style: { ...styles.td, ...styles.mAfter } }, r.after),
          h(Text, { style: { ...styles.tdGreen, ...styles.mDelta } }, r.delta)
        )
      )
    )
  );
};

function StatusBadge({ label }) {
  const lower = label.toLowerCase();
  let bg = C.successSoft, border = C.successBorder, color = C.success;
  if (lower === "issues" || lower === "drift") {
    bg = C.dangerSoft; border = C.dangerBorder; color = C.danger;
  } else if (lower === "watch") {
    bg = C.warnSoft; border = C.warnBorder; color = C.warn;
  }
  return h(
    View,
    { style: { ...styles.statusPillSm, backgroundColor: bg, borderColor: border } },
    h(Text, { style: { ...styles.statusPillSmText, color } }, label.toUpperCase())
  );
}

const SitesTable = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "6.  Per-site status"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.sSite } }, "Site"),
        h(Text, { style: { ...styles.th, ...styles.sBefore } }, "Before"),
        h(Text, { style: { ...styles.th, ...styles.sAfter } }, "After"),
        h(Text, { style: { ...styles.th, ...styles.sComment } }, "Comment")
      ),
      ...siteRows.map((s, i) =>
        h(
          View,
          { key: i, style: styles.tr },
          h(Text, { style: { ...styles.td, ...styles.sSite, fontFamily: "Helvetica-Bold" } }, s.site),
          h(View, { style: styles.sBefore }, h(StatusBadge, { label: s.before })),
          h(View, { style: styles.sAfter }, h(StatusBadge, { label: s.after })),
          h(Text, { style: { ...styles.tdMuted, ...styles.sComment } }, s.comment)
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
      h(Text, { style: styles.readyTitle }, "7.  Ready for next cycle"),
      h(
        Text,
        { style: styles.readyText },
        "All checks passed: availability, content, payment, email, mobile, trust, and SEO. Daily crawl continues. Next weekly report is automated for Friday 09:00."
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
    "Web Assessment Agency · webassessment.agency · Generated by Pam — Before/After report"
  );

const Doc = () =>
  h(
    Document,
    {
      title: "Before/After Report — Week 20",
      author: "Web Assessment Agency",
      subject: "Sample Before/After report",
    },
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Hero),
      h(Summary),
      h(BeforeStatus)
    ),
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Applied),
      h(AfterStatus)
    ),
    h(
      Page,
      { size: "A4", style: styles.page },
      h(Metrics),
      h(SitesTable),
      h(Ready),
      h(Audit),
      h(Footer)
    )
  );

mkdirSync(dirname(outPath), { recursive: true });
await renderToFile(h(Doc), outPath);
console.log(`Wrote ${outPath}`);
