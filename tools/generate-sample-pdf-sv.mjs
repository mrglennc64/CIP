// Swedish weekly assessment report — mirrors generate-sample-pdf.mjs
// Carina-ton: kort, sakligt, operativt, noll fluff.
// Run with: node tools/generate-sample-pdf-sv.mjs
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
const outPath = resolve(here, "..", "public", "reports", "sample-report-sv.pdf");

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

  sectionLabel: {
    fontSize: 10,
    color: C.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },

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

  sectionHead: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 10,
  },

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
});

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

// --- Svensk innehåll (Vecka 20) — Hybridton ---
const kpis = [
  { label: "Skannade webbplatser", value: "6", sub: "webbplatser över 3 planer" },
  { label: "CLEAN", value: "6", sub: "100% av övervakade" },
  { label: "Genomförda förbättringar", value: "4", sub: "alla live" },
  { label: "Öppna ärenden", value: "0", sub: "redo för nästa cykel" },
];

const applied = [
  { n: 2, title: "A/B-tester avslutade", desc: "Variant B rullad till 100% på nordicpay.se (+4,1%)" },
  { n: 1, title: "Trasig länk åtgärdad", desc: "helsinki-shop.fi/products/old-promo" },
  { n: 3, title: "E-posttriggers verifierade", desc: "Onboardingsekvens E1–E3 levererar under 30 sek" },
  { n: 4, title: "Metadata uppdaterad", desc: "copenhagen-tech.dk — 4 sidor uppdaterade" },
  { n: 1, title: "Hero-text omskriven", desc: "stockholm-fitness.se /home — tydlighetsförbättring" },
  { n: 2, title: "Sociala inlägg publicerade", desc: "Vecka 20 — plattformsredo innehåll" },
];

const checks = [
  "Tillgänglighet — alla 6 sajter svarar under 1s",
  "Innehållsdrift — inga oväntade sidändringar",
  "Trasiga länkar — 1 hittad och fixad",
  "Betalningsflöde — end-to-end test OK",
  "E-posttriggers — onboarding <30s",
  "Mobil layout — inga overflow-problem",
  "Förtroendesignaler — privacy, villkor, kontakt",
  "SEO-basics — title, description, OG-bild",
];

const sites = [
  { n: 1, site: "nordicpay.se", change: "Variant B rullad · +4,1%" },
  { n: 2, site: "helsinki-shop.fi", change: "Trasig länk fixad" },
  { n: 3, site: "copenhagen-tech.dk", change: "Metadata uppdaterad" },
  { n: 4, site: "aurora-saas.com", change: "Trigger E3 OK" },
  { n: 5, site: "stockholm-fitness.se", change: "Hero-text omskriven" },
  { n: 6, site: "gothenburg-clinic.se", change: "Ingen ändring" },
];

const Pill = () =>
  h(
    View,
    { style: styles.pillRow },
    h(
      View,
      { style: styles.pill },
      h(Text, { style: styles.pillText }, "✓  RENT")
    )
  );

const Hero = () =>
  h(
    View,
    { style: styles.hero },
    h(
      View,
      { style: styles.heroLeft },
      h(Text, { style: styles.h1 }, "Vecka 20 — Alla kanaler granskade"),
      h(
        Text,
        { style: styles.sub },
        "6 webbplatser skannade · 0 kritiska ärenden · 4 förbättringar genomförda · 2 A/B-tester avslutade. Katalogen är i stabilt skick och redo för nästa cykel."
      )
    ),
    h(ScoreCircle, { score: 98, max: 100, size: 84 })
  );

const ScoreStrip = () =>
  h(
    View,
    {},
    h(Text, { style: styles.sectionLabel }, "Poängförändring"),
    h(
      View,
      { style: styles.scoreStrip },
      h(
        Text,
        { style: styles.scoreBefore },
        h(Text, { style: { fontFamily: "Helvetica-Bold" } }, "Förra veckan: "),
        "92 / 100 — 3 öppna ärenden, 1 konverteringsfall flaggat."
      ),
      h(
        Text,
        { style: styles.scoreAfter },
        h(Text, { style: { fontFamily: "Helvetica-Bold", color: C.success } }, "Denna vecka: "),
        "98 / 100 — alla ärenden lösta. ",
        h(Text, { style: styles.scoreNote }, "+6 poäng · 0 öppna")
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
    h(Text, { style: styles.sectionHead }, "1.  Genomförda ändringar"),
    h(
      Text,
      { style: { ...styles.sub, marginBottom: 10 } },
      "Alla ändringar bekräftades av tenant innan publicering."
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
    h(Text, { style: styles.sectionHead }, "2.  Valideringskontroller"),
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
    h(Text, { style: styles.sectionHead }, "3.  Status per webbplats"),
    h(
      View,
      { style: styles.table },
      h(
        View,
        { style: { ...styles.tr, ...styles.trFirst, backgroundColor: C.bg } },
        h(Text, { style: { ...styles.th, ...styles.cNum } }, "#"),
        h(Text, { style: { ...styles.th, ...styles.cSite } }, "Webbplats"),
        h(Text, { style: { ...styles.th, ...styles.cStatus } }, "Status"),
        h(Text, { style: { ...styles.th, ...styles.cChange } }, "Ändring")
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
      h(Text, { style: styles.readyTitle }, "Redo för nästa cykel"),
      h(
        Text,
        { style: styles.readyText },
        "Alla 6 sajter passerade kontroller för tillgänglighet, innehåll, betalning, e-post, mobil, förtroende och SEO. Daglig skanning fortsätter — nästa veckorapport publiceras fredag 09:00."
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
      "Alla 13 ändringar i rapporten godkändes av tenant via korrigeringsdokumentet 2026-05-16. Tenant behåller full kontroll över alla beslut; Pam genomför endast godkända ändringar."
    )
  );

const Footer = () =>
  h(
    Text,
    { style: styles.footer },
    "Communications Intelligence Platform · cip.usesmpt.com · Genererad av Pam — veckorapport"
  );

const Doc = () =>
  h(
    Document,
    {
      title: "Kommunikationsintelligens — Veckorapport, Vecka 20",
      author: "Communications Intelligence Platform",
      subject: "Exempel veckorapport",
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
