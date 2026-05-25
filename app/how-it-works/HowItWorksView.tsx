"use client";

import { Container } from "../components/Container";
import { Section } from "../components/Section";
import { Button } from "../components/Button";
import {
  processSteps,
  cadenceTable,
  guarantees,
  faqs,
} from "@/lib/content/process";
import { useLocale, useT } from "../i18n/LocaleProvider";

const whoStyles: Record<string, string> = {
  Us: "bg-wa-primary-soft text-wa-primary",
  Pam: "bg-blue-50 text-blue-700",
  You: "bg-gray-100 text-gray-700",
};

export function HowItWorksView() {
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  return (
    <>
      <Section className="pt-16">
        <Container>
          <p className="text-xs font-medium uppercase tracking-wide text-wa-primary">
            {t("how.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-text">
            {t("how.h1")}
          </h1>
          <p className="mt-4 max-w-2xl text-text-muted">
            {t("how.lead")}
          </p>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface pt-12">
        <Container>
          <h2 className="text-2xl font-semibold text-text">{t("how.process.h2")}</h2>
          <ol className="mt-8 space-y-4">
            {processSteps.map((s) => {
              const title = sv && s.titleSv ? s.titleSv : s.title;
              const description = sv && s.descriptionSv ? s.descriptionSv : s.description;
              const output = sv && s.outputSv ? s.outputSv : s.output;
              const whoLabel = t(`how.who.${s.who}`);
              const dayLabel =
                s.durationDays === 1 ? t("how.day") : t("how.days");
              return (
                <li
                  key={s.n}
                  className="rounded-lg border border-border bg-bg p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wa-primary text-base font-bold text-white">
                      {s.n}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-text">
                          {title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${whoStyles[s.who]}`}
                        >
                          {whoLabel}
                        </span>
                        <span className="text-xs text-text-muted">
                          ~{s.durationDays} {dayLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-text-muted leading-relaxed">
                        {description}
                      </p>
                      <p className="mt-3 text-xs">
                        <span className="font-semibold uppercase tracking-wide text-text-muted">
                          {t("how.output")}
                        </span>{" "}
                        <span className="text-text">{output}</span>
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <h2 className="text-2xl font-semibold text-text">{t("how.cadence.h2")}</h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            {t("how.cadence.lead")}
          </p>

          <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3">{t("how.cadence.head.frequency")}</th>
                  <th className="px-5 py-3">{t("how.cadence.head.what")}</th>
                  <th className="px-5 py-3">{t("how.cadence.head.trigger")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cadenceTable.map((c) => (
                  <tr key={c.frequency} className="align-top">
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-wa-primary-soft px-2.5 py-0.5 text-xs font-semibold text-wa-primary">
                        {sv && c.frequencySv ? c.frequencySv : c.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text">
                      {sv && c.whatSv ? c.whatSv : c.what}
                    </td>
                    <td className="px-5 py-4 text-text-muted">
                      {sv && c.triggerSv ? c.triggerSv : c.trigger}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <h2 className="text-2xl font-semibold text-text">{t("how.principles.h2")}</h2>
          <p className="mt-2 max-w-2xl text-text-muted">
            {t("how.principles.lead")}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {guarantees.map((g) => {
              const title = sv && g.titleSv ? g.titleSv : g.title;
              const description = sv && g.descriptionSv ? g.descriptionSv : g.description;
              return (
                <div
                  key={g.title}
                  className="rounded-lg border border-border bg-bg p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700"
                    >
                      ✓
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-text">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm text-text-muted leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <h2 className="text-2xl font-semibold text-text">{t("how.faq.h2")}</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => {
              const q = sv && f.qSv ? f.qSv : f.q;
              const a = sv && f.aSv ? f.aSv : f.a;
              return (
                <details
                  key={f.q}
                  className="group rounded-lg border border-border bg-surface p-5 shadow-sm open:shadow-md"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-medium text-text">{q}</h3>
                      <span
                        aria-hidden
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm text-text-muted leading-relaxed">
                    {a}
                  </p>
                </details>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <div className="rounded-lg border border-border bg-bg p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-text">
              {t("how.cta.h2")}
            </h2>
            <p className="mt-3 text-text-muted">
              {t("how.cta.lead")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/reports/sample-week-20">{t("how.cta.sample")}</Button>
              <Button href="/pricing" variant="outline">{t("how.cta.pricing")}</Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
