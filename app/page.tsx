"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Container } from "./components/Container";
import { Section } from "./components/Section";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { services } from "@/lib/content/services";
import { competitorComparison } from "@/lib/content/positioning";
import { useLocale, useT } from "./i18n/LocaleProvider";

export default function HomePage() {
  const previewServices = services.slice(0, 3);
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousScanUrl, setPreviousScanUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPreviousScanUrl(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/free-scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        scanUrl?: string;
        error?: string;
        daysUntilNext?: number;
        previousScanUrl?: string;
      };
      if (res.status === 201 && data.scanUrl) {
        router.push(data.scanUrl);
        return;
      }
      if (res.status === 429 && data.daysUntilNext != null) {
        setError(
          t("home.freeScan.errRateLimited", { days: data.daysUntilNext })
        );
        if (data.previousScanUrl) setPreviousScanUrl(data.previousScanUrl);
        setSubmitting(false);
        return;
      }
      setError(data.error ?? t("home.freeScan.errGeneric"));
      setSubmitting(false);
    } catch {
      setError(t("home.freeScan.errGeneric"));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Section className="pt-16 sm:pt-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text leading-[1.1]">
              {t("home.hero.h1")}
            </h1>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              {t("home.hero.lead")}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-wa-primary">
                {t("home.freeScan.eyebrow")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="freescan-email"
                    className="block text-xs font-medium text-text-muted"
                  >
                    {t("home.freeScan.emailLabel")}
                  </label>
                  <input
                    id="freescan-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t("home.freeScan.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="freescan-url"
                    className="block text-xs font-medium text-text-muted"
                  >
                    {t("home.freeScan.urlLabel")}
                  </label>
                  <input
                    id="freescan-url"
                    type="text"
                    inputMode="url"
                    required
                    placeholder={t("home.freeScan.urlPlaceholder")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-text focus:border-wa-primary focus:outline-none focus:ring-1 focus:ring-wa-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                  {previousScanUrl && (
                    <>
                      {" "}
                      <Link
                        href={previousScanUrl}
                        className="font-medium underline"
                      >
                        {t("home.freeScan.viewPrevious")}
                      </Link>
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-text-muted">
                  {t("home.freeScan.note")}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-wa-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-wa-primary-dark disabled:opacity-60"
                >
                  {submitting
                    ? t("home.freeScan.submitting")
                    : t("home.freeScan.submit")}
                </button>
              </div>
            </form>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-surface">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wide text-wa-primary">
                {t("home.five.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-text">
                {t("home.five.h2")}
              </h2>
              <p className="mt-3 text-text-muted">
                {t("home.five.lead")}
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-bg shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3">{t("home.five.head.type")}</th>
                  <th className="px-5 py-3">{t("home.five.head.theyDo")}</th>
                  <th className="px-5 py-3">{t("home.five.head.weDo")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitorComparison.map((row) => (
                  <tr key={row.type} className="align-top">
                    <td className="px-5 py-4 font-medium text-text">
                      {sv && row.typeSv ? row.typeSv : row.type}
                    </td>
                    <td className="px-5 py-4 text-text-muted">
                      {sv && row.theyDoSv ? row.theyDoSv : row.theyDo}
                    </td>
                    <td className="px-5 py-4 text-text">
                      <span className="inline-flex items-start gap-2">
                        <span
                          aria-hidden
                          className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-wa-primary"
                        />
                        <span>{sv && row.weDoSv ? row.weDoSv : row.weDo}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-text-muted">
            {t("home.five.tagline")}
          </p>
        </Container>
      </Section>

      <Section className="border-t border-border">
        <Container>
          <h2 className="text-2xl sm:text-3xl font-semibold text-text">{t("home.core.h2")}</h2>
          <p className="mt-2 text-text-muted">{t("home.core.lead")}</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {previewServices.map((s) => (
              <Card key={s.slug} title={sv && s.nameSv ? s.nameSv : s.name}>
                <p className="text-sm text-text-muted">
                  {sv && s.shortDescriptionSv ? s.shortDescriptionSv : s.shortDescription}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Button href="/services">{t("home.core.viewAll")}</Button>
          </div>
        </Container>
      </Section>

    </>
  );
}
