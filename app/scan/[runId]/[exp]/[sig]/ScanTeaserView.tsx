"use client";

import Link from "next/link";
import type { Channel, Finding, Job, Run } from "@/lib/jobs/types";
import { channels, channelLabels } from "@/lib/jobs/types";
import { useLocale, useT } from "@/app/i18n/LocaleProvider";

type StatusKey = "pass" | "watch" | "critical";

function statusForJob(job: Job): StatusKey {
  const f = job.result?.findings ?? [];
  if (f.some((x) => x.severity === "issue")) return "critical";
  if (f.some((x) => x.severity === "warn")) return "watch";
  return "pass";
}

const channelLabelsSv: Record<Channel, string> = {
  audit: "Audit & CRO",
  seo: "SEO / tekniskt",
  funnel: "Funnel / betalning (statisk)",
  email: "E-post",
  deliverability: "E-postleverans (DNS)",
  social: "Socialt",
  browser: "Syntetisk webbläsarkontroll",
};

const LOCKED_CATEGORY_KEYS = [
  "scan.lockedCat.payment",
  "scan.lockedCat.email",
  "scan.lockedCat.metadata",
  "scan.lockedCat.mobile",
  "scan.lockedCat.broken",
  "scan.lockedCat.conversion",
  "scan.lockedCat.seo",
  "scan.lockedCat.content",
];

type ChannelFinding = Finding & { channel: Channel };

export function ScanTeaserView({ run }: { run: Run }) {
  const { locale } = useLocale();
  const t = useT();
  const sv = locale === "sv";

  const completed = channels
    .map((ch) => run.jobs[ch])
    .filter((j) => j.status === "done" && j.result);
  const pending = channels.length - completed.length;
  const stillScanning = pending > 0;

  const allFindings: ChannelFinding[] = completed.flatMap((j) =>
    (j.result?.findings ?? []).map((f) => ({ ...f, channel: j.channel }))
  );
  const issueFindings = allFindings.filter((f) => f.severity === "issue");
  const warnFindings = allFindings.filter((f) => f.severity === "warn");

  // Teaser: first 2 critical, then 1 watch. Lock the rest of critical+watch.
  const unblurred: ChannelFinding[] = [
    ...issueFindings.slice(0, 2),
    ...warnFindings.slice(0, 1),
  ];
  const totalActionable = issueFindings.length + warnFindings.length;
  const lockedCount = Math.max(0, totalActionable - unblurred.length);

  const overallScore =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((s, j) => s + (j.result?.score ?? 0), 0) /
            completed.length
        );

  // Group unblurred findings by channel for the rendering pass.
  const unblurredByChannel = new Map<Channel, ChannelFinding[]>();
  for (const f of unblurred) {
    const existing = unblurredByChannel.get(f.channel) ?? [];
    existing.push(f);
    unblurredByChannel.set(f.channel, existing);
  }

  const channelName = (ch: Channel) =>
    sv ? channelLabelsSv[ch] : channelLabels[ch];

  const statusLabel = (key: StatusKey) => {
    if (key === "critical") return t("scan.statusCritical");
    if (key === "watch") return t("scan.statusWatch");
    return t("scan.statusPass");
  };

  const statusCellCls = (key: StatusKey) =>
    key === "critical"
      ? "bg-red-50 text-red-700 border-red-200"
      : key === "watch"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-green-50 text-green-700 border-green-200";

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-text hover:text-wa-primary"
          >
            Web Assessment Agency
          </Link>
          <span className="text-xs text-text-muted">
            {sv ? "Gratis skanning" : "Free scan"}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-text">
            {t("scan.titlePrefix")} {run.customer}
          </h1>
          <p className="mt-3 text-base text-text">
            <span className="font-semibold">{t("scan.scoreLabel")}:</span>{" "}
            <span className="font-bold">{overallScore} / 100</span>
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {stillScanning
              ? t("scan.scanning", {
                  done: completed.length,
                  total: channels.length,
                })
              : t("scan.allReviewed", { total: channels.length })}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">
            {t("scan.channelOverview")}
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3">{t("scan.channelCol")}</th>
                  <th className="px-5 py-3">{t("scan.statusCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {channels.map((ch) => {
                  const status = statusForJob(run.jobs[ch]);
                  return (
                    <tr key={ch}>
                      <td className="px-5 py-3 font-medium text-text">
                        {channelName(ch)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCellCls(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">
            {t("scan.visibleFindings", {
              shown: unblurred.length,
              total: totalActionable,
            })}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t("scan.visibleFindingsLead")}
          </p>

          {unblurred.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">
              {sv
                ? "Inga kritiska eller bevakningsfynd hittills."
                : "No critical or watch findings so far."}
            </p>
          ) : (
            <div className="mt-5 space-y-6">
              {[...unblurredByChannel.entries()].map(([ch, findings]) => (
                <div key={ch}>
                  <h3 className="text-sm font-semibold text-wa-primary">
                    {channelName(ch)}
                  </h3>
                  <ul className="mt-2 space-y-3">
                    {findings.map((f, i) => {
                      const dotCls =
                        f.severity === "issue"
                          ? "bg-red-500"
                          : "bg-yellow-500";
                      return (
                        <li
                          key={i}
                          className="rounded-md border border-border bg-surface px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              aria-hidden
                              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dotCls}`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text">
                                {f.label}
                              </p>
                              {f.detail && (
                                <p className="mt-1 text-xs text-text-muted">
                                  <span className="font-semibold">
                                    {t("scan.impactLabel")}
                                  </span>{" "}
                                  {f.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {lockedCount > 0 && (
          <section className="mt-10 rounded-xl border border-dashed border-border bg-bg/60 p-6">
            <h2 className="text-base font-semibold text-text">
              🔒 {t("scan.lockedHeading", { n: lockedCount })}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {t("scan.lockedLead")}
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-text sm:grid-cols-2">
              {LOCKED_CATEGORY_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-wa-primary"
                  />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-wa-primary bg-wa-primary-soft p-6">
          <h2 className="text-lg font-semibold text-text">
            {t("scan.upgradeH2")}
          </h2>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            {t("scan.upgradeBody")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md bg-wa-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-wa-primary-dark"
            >
              {t("scan.unlockBtn")}
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-wa-primary px-5 py-2.5 text-sm font-medium text-wa-primary hover:bg-wa-primary/10"
            >
              {t("scan.seePricingBtn")}
            </Link>
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-xs text-text-muted">
          <p>{t("scan.footerNote")}</p>
        </footer>
      </main>
    </div>
  );
}
