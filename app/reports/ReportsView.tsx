"use client";

import Link from "next/link";
import { Container } from "../components/Container";
import { Section } from "../components/Section";
import { weeklyReports } from "@/lib/content/weekly-reports";
import { useLocale, useT } from "../i18n/LocaleProvider";

export function ReportsView() {
  const sorted = [...weeklyReports].sort((a, b) => b.date.localeCompare(a.date));
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  return (
    <Section className="pt-16">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
          {t("reports.h1")}
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          {t("reports.lead")}
        </p>

        <ul className="mt-10 space-y-3">
          {sorted.map((r) => {
            const title = sv && r.titleSv ? r.titleSv : r.title;
            const week = sv && r.weekSv ? r.weekSv : r.week;
            const summary = sv && r.summarySv ? r.summarySv : r.summary;
            const pdfUrl = sv && r.pdfUrlSv ? r.pdfUrlSv : r.pdfUrl;
            return (
              <li
                key={r.slug}
                className="rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {week} · {r.date}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-text">
                      <Link
                        href={`/reports/${r.slug}`}
                        className="hover:text-wa-primary"
                      >
                        {title}
                      </Link>
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-text-muted">
                      {summary}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/reports/${r.slug}`}
                      className="inline-flex items-center justify-center rounded-md border border-wa-primary px-4 py-2 text-sm font-medium text-wa-primary transition-colors hover:bg-wa-primary-soft"
                    >
                      {t("reports.details")}
                    </Link>
                    <Link
                      href={pdfUrl}
                      className="inline-flex items-center justify-center rounded-md bg-wa-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-wa-primary-dark"
                    >
                      {t("reports.pdf")}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
