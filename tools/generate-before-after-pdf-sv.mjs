// Swedish Before/After report — strukturerad PDF i Carina-ton.
// Run with: node tools/generate-before-after-pdf-sv.mjs
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
const outPath = resolve(here, "..", "public", "reports", "sample-before-after-sv.pdf");

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

  // Before / After / Delta cards
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

  // Status sections
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

  // Applied tiles
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

  // Metric table
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

  // Metric col widths
  mLabel: { flex: 1.6 },
  mBefore: { width: 70 },
  mAfter: { width: 70 },
  mDelta: { width: 80 },

  // Site col widths
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

// --- Sample data (Hybridton) ---
const before = {
  score: 78,
  issues: 11,
  risks: 4,
  conversion: 2.3,
  contentIssues: "Otydlig hero-text på 3 sidor · saknad CTA på /pricing",
  paymentIssues: "Checkout-bounce 18% över snitt · Variant A underpresterade",
  emailIssues: "Sekvens E3 över 60s latens · 2 onboarding-mail saknade länk",
  techIssues: "1 trasig länk i transaktionsmail · 404 i 12 dagar",
  trustIssues: "Ingen synlig privacy-länk på /payment",
  seoIssues: "Title saknades på 4 sidor · OG-bild saknades på /home",
};

const after = {
  score: 98,
  issues: 0,
  risks: 0,
  conversion: 6.4,
  contentStatus: "Hero-text omskriven · CTA tillagd",
  paymentStatus: "Variant B rullad till 100% (+4,1%)",
  emailStatus: "E1–E3 under 30s · sekvens verifierad",
  techStatus: "404-länk borttagen · inga fel kvar",
  trustStatus: "Privacy-länk synlig i alla flöden",
  seoStatus: "Title, description, OG-bild på alla sidor",
};

const delta = {
  score: after.score - before.score,
  conversion: +(after.conversion - before.conversion).toFixed(1),
  issues: after.issues - before.issues,
  brokenLinks: -1,
  metadata: -4,
};

const changes = [
  { n: 1, title: "Variant B rullad till 100%", desc: "+4,1% konvertering · 95% säkerhet" },
  { n: 2, title: "Trasig länk fixad", desc: "/products/old-promo borttagen" },
  { n: 3, title: "Metadata uppdaterad", desc: "Title, description, OG-bild på 4 sidor" },
  { n: 4, title: "Hero-text omskriven", desc: "/home — tydlighetsförbättring" },
  { n: 5, title: "E-postsekvens verifierad", desc: "E1–E3 under 30s" },
  { n: 6, title: "Sociala inlägg publicerade", desc: "Vecka 20 — plattformsredo innehåll" },
];

const siteRows = [
  { site: "nordicpay.se", before: "Watch", after: "Clean", comment: "Variant B rullad" },
  { site: "helsinki-shop.fi", before: "Issues", after: "Clean", comment: "Trasig länk fixad" },
  { site: "copenhagen-tech.dk", before: "Watch", after: "Clean", comment: "Metadata uppdaterad" },
  { site: "aurora-saas.com", before: "Watch", after: "Clean", comment: "Trigger E3 OK" },
  { site: "stockholm-fitness.se", before: "Drift", after: "Stable", comment: "Hero-text omskriven" },
  { site: "gothenburg-clinic.se", before: "Clean", after: "Clean", comment: "Ingen ändring" },
];

// --- Components ---
const Hero = () =>
  h(
    View,
    { style: styles.hero },
    h(Text, { style: styles.h1 }, "Före/Efter-rapport — Vecka 20"),
    h(
      Text,
      { style: styles.sub },
      "6 webbplatser granskade · 0 kritiska ärenden · 4 förbättringar genomförda. Rapporten visar mätbara förändringar före och efter genomförda åtgärder."
    )
  );

const Summary = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "1.  Sammanfattning"),
    h(
      View,
      { style: styles.baCardRow },
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardBefore } },
        h(Text, { style: styles.baLabel }, "Före"),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Poäng: "), `${before.score} / 100`),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Öppna ärenden: "), String(before.issues)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Risker: "), String(before.risks)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Konvertering: "), `${before.conversion}%`)
      ),
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardAfter } },
        h(Text, { style: styles.baLabel }, "Efter"),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Poäng: "), `${after.score} / 100`),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Öppna ärenden: "), String(after.issues)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Åtgärdat: "), String(before.risks)),
        h(Text, { style: styles.baLine }, h(Text, { style: styles.baStrong }, "Konvertering: "), `${after.conversion}%`)
      ),
      h(
        View,
        { style: { ...styles.baCard, ...styles.baCardDelta } },
        h(Text, { style: styles.baLabel }, "Förändring"),
        h(Text, { style: styles.baLine }, `+${delta.score} poäng`),
        h(Text, { style: styles.baLine }, `+${delta.conversion}% konvertering`),
        h(Text, { style: styles.baLine }, `${Math.abs(delta.issues)} ärenden lösta`),
        h(Text, { style: styles.baLine }, "Alla risker åtgärdade")
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
    title: "2.  Före-läge",
    items: [
      { head: "Struktur & innehåll", text: before.contentIssues },
      { head: "Betalningsflöde", text: before.paymentIssues },
      { head: "E-post & automation", text: before.emailIssues },
      { head: "Tekniska fel", text: before.techIssues },
      { head: "Förtroendesignaler", text: before.trustIssues },
      { head: "SEO-basics", text: before.seoIssues },
    ],
  });

const Applied = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "3.  Genomförda ändringar"),
    h(
      Text,
      { style: { ...styles.sub, marginBottom: 10 } },
      "Alla ändringar bekräftades av tenant innan publicering."
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
    title: "4.  Efter-läge",
    items: [
      { head: "Struktur & innehåll", text: after.contentStatus },
      { head: "Betalningsflöde", text: after.paymentStatus },
      { head: "E-post & automation", text: after.emailStatus },
      { head: "Tekniska fel", text: after.techStatus },
      { head: "Förtroendesignaler", text: after.trustStatus },
      { head: "SEO-basics", text: after.seoStatus },
    ],
  });

const Metrics = () => {
  const rows = [
    { label: "Poäng", before: String(before.score), after: String(after.score), delta: `+${delta.score}` },
    { label: "Konvertering", before: `${before.conversion}%`, after: `${after.conversion}%`, delta: `+${delta.conversion}%` },
    { label: "Öppna ärenden", before: String(before.issues), after: String(after.issues), delta: String(delta.issues) },
    { label: "Trasiga länkar", before: "1", after: "0", delta: String(delta.brokenLinks) },
    { label: "Metadatafel", before: "4", after: "0", delta: String(delta.metadata) },
  ];
  return h(
    View,
    {},
    h(Text, { style: styles.sectionHead }, "5.  Mätbara förbättringar"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.mLabel } }, "Metrik"),
        h(Text, { style: { ...styles.th, ...styles.mBefore } }, "Före"),
        h(Text, { style: { ...styles.th, ...styles.mAfter } }, "Efter"),
        h(Text, { style: { ...styles.th, ...styles.mDelta } }, "Förändring")
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
    h(Text, { style: styles.sectionHead }, "6.  Status per webbplats"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.sSite } }, "Webbplats"),
        h(Text, { style: { ...styles.th, ...styles.sBefore } }, "Före"),
        h(Text, { style: { ...styles.th, ...styles.sAfter } }, "Efter"),
        h(Text, { style: { ...styles.th, ...styles.sComment } }, "Kommentar")
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
      h(Text, { style: styles.readyTitle }, "7.  Redo för nästa cykel"),
      h(
        Text,
        { style: styles.readyText },
        "Alla kontroller passerade: tillgänglighet, innehåll, betalning, e-post, mobil, förtroende och SEO. Daglig skanning fortsätter. Nästa veckorapport publiceras fredag 09:00."
      )
    )
  );

const Audit = () =>
  h(
    View,
    { style: styles.audit },
    h(Text, { style: styles.auditLabel }, "Revisionsspår"),
    h(
      Text,
      { style: styles.auditText },
      "Alla 13 ändringar godkändes av tenant via korrigeringsdokumentet 2026-05-16. Tenant behåller full kontroll över alla beslut; Pam genomför endast godkända ändringar."
    )
  );

const Footer = () =>
  h(
    Text,
    { style: styles.footer },
    "Web Assessment Agency · webassessment.agency · Genererad av Pam — Före/Efter-rapport"
  );

const Doc = () =>
  h(
    Document,
    {
      title: "Före/Efter-rapport — Vecka 20",
      author: "Web Assessment Agency",
      subject: "Exempel Före/Efter-rapport",
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
