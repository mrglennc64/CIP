import type { WeeklyReport } from "@/lib/types";

export const weeklyReports: WeeklyReport[] = [
  {
    slug: "sample-week-20",
    title: "Sample Weekly Assessment",
    week: "Week 20",
    summary:
      "Sample of the structured weekly report used for all client assessments. Covers content, structure, payment flow, email, and monitoring observations.",
    pdfUrl: "/reports/sample-report.pdf",
    date: "2026-05-18",
    titleSv: "Exempel: Veckorapport",
    weekSv: "Vecka 20",
    summarySv:
      "Ett exempel på den strukturerade veckorapporten som används i alla kunduppdrag. Rapporten täcker innehåll, struktur, betalningsflöden, e-postsekvenser och övervakningsresultat.",
    pdfUrlSv: "/reports/sample-report-sv.pdf",
  },
  {
    slug: "sample-before-after-week-20",
    title: "Sample Before/After Report",
    week: "Week 20",
    summary:
      "Snapshot and comparison report showing measurable improvement after applied changes. Covers content, payment, email, technical, trust, and SEO state — before and after.",
    pdfUrl: "/reports/sample-before-after.pdf",
    date: "2026-05-18",
    titleSv: "Exempel: Före/Efter-rapport",
    weekSv: "Vecka 20",
    summarySv:
      "Snapshot och jämförelserapport som visar mätbara förbättringar efter genomförda ändringar. Täcker innehåll, betalningsflöden, e-post, tekniska kontroller, förtroendeindikatorer och SEO — före och efter.",
    pdfUrlSv: "/reports/sample-before-after-sv.pdf",
  },
];
