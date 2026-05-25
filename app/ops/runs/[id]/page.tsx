"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { Job, Run } from "@/lib/jobs/types";
import { channelLabels, channels } from "@/lib/jobs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ApiPayload = {
  run: Run;
  share?: { path: string; expiresAt: number } | null;
};

const statusStyles: Record<
  Job["status"],
  { label: string; pill: string; dot: string }
> = {
  pending: { label: "Pending", pill: "bg-gray-50 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  running: { label: "Running", pill: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500 animate-pulse" },
  done: { label: "Done", pill: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  failed: { label: "Failed", pill: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

const severityStyles = {
  ok: { dot: "bg-green-500", text: "text-text" },
  warn: { dot: "bg-yellow-500", text: "text-text" },
  issue: { dot: "bg-red-500", text: "text-text" },
};

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, error } = useSWR<ApiPayload>(
    `/api/ops/runs/${id}`,
    fetcher,
    {
      refreshInterval: (latest) => {
        const run = latest?.run;
        if (!run) return 2000;
        const stillRunning = Object.values(run.jobs).some(
          (j) => j.status === "pending" || j.status === "running"
        );
        return stillRunning ? 2000 : 0;
      },
    }
  );

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load run.
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-text-muted">Loading…</p>;
  }
  if (!data.run) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Run not found.
      </div>
    );
  }

  const run = data.run;
  const all = Object.values(run.jobs);
  const done = all.filter((j) => j.status === "done" || j.status === "failed").length;
  const total = all.length;
  const allFinished = done === total;
  const overallScore = (() => {
    const completed = all.filter((j) => j.status === "done" && j.result);
    if (completed.length === 0) return null;
    return Math.round(
      completed.reduce((s, j) => s + (j.result?.score ?? 0), 0) /
        completed.length
    );
  })();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/ops/runs"
            className="text-xs text-text-muted hover:text-text"
          >
            ← All runs
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
            {run.customer}
          </h1>
          <p className="mt-1 font-mono text-sm text-text-muted">{run.url}</p>
        </div>
        <div className="flex items-center gap-3">
          {overallScore !== null && (
            <div className="rounded-lg border border-border bg-surface px-4 py-2 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                Overall score
              </p>
              <p className="text-2xl font-bold text-text">{overallScore}</p>
            </div>
          )}
          <div className="rounded-lg border border-border bg-surface px-4 py-2 text-center shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              Progress
            </p>
            <p className="text-2xl font-bold text-text">
              {done}<span className="text-text-muted text-base"> / {total}</span>
            </p>
          </div>
        </div>
      </div>

      {allFinished && (
        <CompletionPanel run={run} share={data.share ?? null} />
      )}

      <div className="mt-8 space-y-4">
        {channels.map((ch) => {
          const job = run.jobs[ch];
          const st = statusStyles[job.status];
          return (
            <article
              key={ch}
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-text">
                      {channelLabels[ch]}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${st.pill}`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block h-1.5 w-1.5 rounded-full ${st.dot}`}
                      />
                      {st.label}
                    </span>
                    {job.durationMs !== undefined && (
                      <span className="text-xs text-text-muted">
                        {job.durationMs} ms
                      </span>
                    )}
                  </div>
                  {job.result && (
                    <p className="mt-2 text-sm text-text-muted">
                      {job.result.summary}
                    </p>
                  )}
                  {job.error && (
                    <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-700">
                      {job.error}
                    </p>
                  )}
                </div>
                {job.result && (
                  <div className="rounded-md border border-border bg-bg px-3 py-1.5 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-text-muted">
                      Score
                    </p>
                    <p className="text-lg font-bold text-text">
                      {job.result.score}
                    </p>
                  </div>
                )}
              </div>

              {job.result && job.result.findings.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {job.result.findings.map((f, i) => {
                    const sv = severityStyles[f.severity];
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                          aria-hidden
                          className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${sv.dot}`}
                        />
                        <div>
                          <span className={sv.text}>{f.label}</span>
                          {f.detail && (
                            <span className="ml-2 text-text-muted">
                              · {f.detail}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {ch === "social" && job.result && Array.isArray(
                (job.result.details as { drafts?: unknown }).drafts
              ) && (
                <DraftPosts
                  drafts={
                    (job.result.details as {
                      drafts: { platform: string; text: string }[];
                    }).drafts
                  }
                />
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function CompletionPanel({
  run,
  share,
}: {
  run: Run;
  share: { path: string; expiresAt: number } | null;
}) {
  const [copied, setCopied] = useState(false);
  // The share path is the customer dashboard URL (HTML), not the PDF.
  const dashboardUrl =
    share && typeof window !== "undefined"
      ? `${window.location.origin}${share.path}`
      : null;

  const onCopy = async () => {
    if (!dashboardUrl) return;
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — leave the URL visible so user can copy manually.
    }
  };

  const expiresDate = share
    ? new Date(share.expiresAt * 1000).toLocaleDateString()
    : null;

  return (
    <div className="mt-6 rounded-lg border border-wa-primary bg-wa-primary-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text">
          <span className="font-semibold">Run complete.</span>{" "}
          <span className="text-text-muted">
            Health Report ready for {run.customer}.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/ops/runs/${run.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-md bg-wa-primary px-4 py-2 text-sm font-medium text-white hover:bg-wa-primary-dark"
          >
            Download PDF
          </a>
          {dashboardUrl && (
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-md border border-wa-primary bg-surface px-4 py-2 text-sm font-medium text-wa-primary hover:bg-wa-primary-soft"
            >
              Preview customer dashboard ↗
            </a>
          )}
          {dashboardUrl && (
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-md border border-wa-primary bg-surface px-4 py-2 text-sm font-medium text-wa-primary hover:bg-wa-primary-soft"
            >
              {copied ? "✓ Copied!" : "Copy customer link"}
            </button>
          )}
        </div>
      </div>
      {dashboardUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-text-muted">Customer dashboard URL:</span>
          <code className="break-all rounded border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text">
            {dashboardUrl}
          </code>
          {expiresDate && (
            <span className="text-text-muted">
              expires {expiresDate} · auth-free
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DraftPosts({
  drafts,
}: {
  drafts: { platform: string; text: string }[];
}) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-3">
      {drafts.map((d, i) => (
        <div
          key={i}
          className="rounded-md border border-border bg-bg p-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-wa-primary">
            {d.platform}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-text">{d.text}</p>
        </div>
      ))}
    </div>
  );
}
