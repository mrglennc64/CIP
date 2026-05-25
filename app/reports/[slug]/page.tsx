import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { weeklyReports } from "@/lib/content/weekly-reports";
import { ReportDetailView } from "./ReportDetailView";

type RouteParams = { slug: string };

export function generateStaticParams(): RouteParams[] {
  return weeklyReports.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = weeklyReports.find((r) => r.slug === slug);
  if (!report) return { title: "Report not found — Web Assessment Agency" };
  return {
    title: `${report.title} — Web Assessment Agency`,
    description: report.summary,
  };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const report = weeklyReports.find((r) => r.slug === slug);
  if (!report) notFound();

  return <ReportDetailView report={report} />;
}
