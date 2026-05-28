import type { Metadata } from "next";
import Link from "next/link";
import { getRun } from "@/lib/jobs/store";
import { verifyShareToken } from "@/lib/share-link";
import {
  channels,
  channelLabels,
  type Channel,
  type Job,
  type Finding,
} from "@/lib/jobs/types";
import { ScoreRing } from "@/app/portal/components/ScoreRing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Health Report — Northern Star · CIP",
  robots: { index: false, follow: false },
};

type Params = { runId: string; exp: string; sig: string };

type StatusKey = "pass" | "watch" | "critical";

const statusMeta: Record<
  StatusKey,
  { label: string; pill: string; dot: string; mark: string }
> = {
  pass: {
    label: "Pass",
    pill: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    mark: "✓",
  },
  watch: {
    label: "Watch",
    pill: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
    mark: "⚠",
  },
  critical: {
    label: "Critical",
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    mark: "✗",
  },
};

function statusForJob(job: Job): StatusKey {
  const f = job.result?.findings ?? [];
  if (f.some((x) => x.severity === "issue")) return "critical";
  if (f.some((x) => x.severity === "warn")) return "watch";
  return "pass";
}

function overallStatus(score: number): { key: StatusKey; label: string } {
  if (score >= 85) return { key: "pass", label: "Operational" };
  if (score >= 60) return { key: "watch", label: "Needs work" };
  return { key: "critical", label: "Critical issues" };
}

function overallSummary(run: ReturnType<typeof getRun>): string {
  if (!run) return "";
  // Heuristic one-liner based on the most-impactful signal.
  const funnel = run.jobs.funnel;
  const browser = run.jobs.browser;
  const funnelCritical =
    funnel.result?.findings.some(
      (f) =>
        f.severity === "issue" &&
        /payment provider|checkout|pay button|payment script/i.test(f.label)
    ) ?? false;
  const browserCritical =
    browser.result?.findings.some(
      (f) => f.severity === "issue" && /stripe|pay\/order|integration/i.test(f.label)
    ) ?? false;

  if (funnelCritical || browserCritical) {
    return "Site loads. Checkout is non-functional. Payment-layer failures detected.";
  }

  const allCriticalChannels = channels.filter(
    (ch) => statusForJob(run.jobs[ch]) === "critical"
  );
  if (allCriticalChannels.length > 0) {
    return `Site loads. Critical issues detected in: ${allCriticalChannels.map((c) => channelLabels[c]).join(", ")}.`;
  }
  const anyWatch = channels.some(
    (ch) => statusForJob(run.jobs[ch]) === "watch"
  );
  if (anyWatch) {
    return "Site is operational. A few items recommended for cleanup.";
  }
  return "Site is operational. No issues detected across the six channels.";
}

export default async function CustomerDashboard({
  params,
}: {
  params: Promise<Params>;
}) {
  const { runId, exp, sig } = await params;
  const secret = process.env.OPS_AUTH_SECRET;

  if (!secret) {
    return (
      <Unavailable
        title="Share links are not configured"
        body="The server does not have an OPS_AUTH_SECRET set."
      />
    );
  }

  const verdict = await verifyShareToken(runId, exp, sig, secret);
  if (!verdict.valid) {
    const body =
      verdict.reason === "expired"
        ? "This link has expired."
        : "This link is invalid or has been tampered with.";
    return (
      <Unavailable
        title="Report unavailable"
        body={body}
        action="If you still need the report, contact your account manager for a fresh link."
      />
    );
  }

  const run = getRun(runId);
  if (!run) {
    return (
      <Unavailable
        title="Report not found"
        body="This report is no longer in the operator's queue."
        action="Contact your account manager for a re-run."
      />
    );
  }

  const completed = channels
    .map((ch) => run.jobs[ch])
    .filter((j) => j.status === "done" && j.result);
  const overallScore =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((s, j) => s + (j.result?.score ?? 0), 0) /
            completed.length
        );
  const overall = overallStatus(overallScore);
  const oneLine = overallSummary(run);

  const allFindings = completed.flatMap((j) => j.result?.findings ?? []);
  const critCount = allFindings.filter((f) => f.severity === "issue").length;
  const watchCount = allFindings.filter((f) => f.severity === "warn").length;
  const passCount = allFindings.filter((f) => f.severity === "ok").length;

  const dateStr = new Date(run.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const expiresStr = new Date(Number(exp) * 1000).toLocaleDateString(
    undefined,
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-text hover:text-wa-primary"
          >
            Northern Star · CIP
          </Link>
          <span className="text-xs text-text-muted">
            Confidential — prepared for{" "}
            <span className="font-medium text-text">{run.customer}</span>
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-wa-primary">
                Health Report
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">
                {run.customer}
              </h1>
              <p className="mt-2 break-all font-mono text-sm text-text-muted">
                {run.url}
              </p>
              <div className="mt-5 inline-flex">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta[overall.key].pill}`}
                >
                  <span
                    aria-hidden
                    className={`inline-block h-1.5 w-1.5 rounded-full ${statusMeta[overall.key].dot}`}
                  />
                  {overall.label}
                </span>
              </div>
              <p className="mt-5 max-w-2xl text-base text-text leading-relaxed">
                {oneLine}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
                <span>
                  Critical: <span className="font-semibold text-text">{critCount}</span>
                </span>
                <span>
                  Watch: <span className="font-semibold text-text">{watchCount}</span>
                </span>
                <span>
                  Passing: <span className="font-semibold text-text">{passCount}</span>
                </span>
                <span>{completed.length} of {channels.length} channels analyzed</span>
              </div>
            </div>
            <div className="shrink-0">
              <ScoreRing score={overallScore} size={140} stroke={12} />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">What we checked</h2>
          <p className="mt-1 text-sm text-text-muted">
            Six channels, scanned both statically and via a headless browser.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {channels.map((ch) => (
              <ChannelCard key={ch} ch={ch} job={run.jobs[ch]} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-wa-primary bg-wa-primary-soft p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text">
                Want this as a PDF?
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                One-click download of the same report.
              </p>
            </div>
            <a
              href={`/r/${runId}/${exp}/${sig}/pdf`}
              className="inline-flex items-center justify-center rounded-md bg-wa-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-wa-primary-dark"
            >
              Download PDF
            </a>
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-xs text-text-muted">
          <p>
            Generated by Pam on <span className="font-medium text-text">{dateStr}</span> · run{" "}
            <code className="font-mono">{run.id}</code>
          </p>
          <p className="mt-1">
            Link expires <span className="font-medium text-text">{expiresStr}</span>. For a fresh link, contact your account manager.
          </p>
          <p className="mt-3">
            Northern Star Systems · cip.usesmpt.com
          </p>
        </footer>
      </main>
    </div>
  );
}

function ChannelCard({ ch, job }: { ch: Channel; job: Job }) {
  const status = statusForJob(job);
  const meta = statusMeta[status];
  const findings = job.result?.findings ?? [];

  // Show issues first, then warns, then oks. Cap at 6.
  const ordered = [
    ...findings.filter((f) => f.severity === "issue"),
    ...findings.filter((f) => f.severity === "warn"),
    ...findings.filter((f) => f.severity === "ok"),
  ];
  const top = ordered.slice(0, 6);
  const remaining = ordered.length - top.length;

  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">
            {channelLabels[ch]}
          </h3>
          {job.result?.summary && (
            <p className="mt-1 text-sm text-text-muted">{job.result.summary}</p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.pill}`}
        >
          {meta.label}
        </span>
      </header>

      {top.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {top.map((f, i) => (
            <FindingRow key={i} f={f} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-text-muted">
          {job.status === "failed"
            ? `Job failed: ${job.error ?? "unknown error"}`
            : "No findings recorded for this channel."}
        </p>
      )}

      {remaining > 0 && (
        <p className="mt-3 text-xs text-text-muted">+ {remaining} more</p>
      )}
    </article>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const color =
    f.severity === "issue"
      ? "bg-red-500"
      : f.severity === "warn"
        ? "bg-yellow-500"
        : "bg-green-500";
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        aria-hidden
        className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color}`}
      />
      <div>
        <span className="text-text">{f.label}</span>
        {f.detail && (
          <span className="ml-2 text-text-muted">· {f.detail}</span>
        )}
      </div>
    </li>
  );
}

function Unavailable({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-wa-primary">
          Northern Star · CIP
        </p>
        <h1 className="mt-4 text-2xl font-bold text-text">{title}</h1>
        <p className="mt-3 text-sm text-text-muted">{body}</p>
        {action && (
          <p className="mt-6 text-xs text-text-muted">{action}</p>
        )}
      </div>
    </div>
  );
}
