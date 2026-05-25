"use client";

import Link from "next/link";
import { Container } from "../../components/Container";
import { Section } from "../../components/Section";
import { Button } from "../../components/Button";
import type { WeeklyReport } from "@/lib/types";
import { useLocale, useT } from "../../i18n/LocaleProvider";

export function ReportDetailView({ report }: { report: WeeklyReport }) {
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  const title = sv && report.titleSv ? report.titleSv : report.title;
  const week = sv && report.weekSv ? report.weekSv : report.week;
  const summary = sv && report.summarySv ? report.summarySv : report.summary;
  const pdfUrl = sv && report.pdfUrlSv ? report.pdfUrlSv : report.pdfUrl;

  return (
    <Section className="pt-16">
      <Container>
        <Link
          href="/reports"
          className="inline-flex items-center text-sm text-text-muted hover:text-text"
        >
          {t("reportDetail.allReports")}
        </Link>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {week} · {report.date}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-text">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-text-muted">{summary}</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={pdfUrl}>{t("reportDetail.download")}</Button>
          <Button href="/portal" variant="outline">{t("reportDetail.openDashboard")}</Button>
        </div>

        <div className="mt-12 rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
          <p>{t("reportDetail.placeholder")}</p>
        </div>
      </Container>
    </Section>
  );
}
