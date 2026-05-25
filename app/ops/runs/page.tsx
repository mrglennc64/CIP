import Link from "next/link";
import { listRuns } from "@/lib/jobs/store";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  const runs = listRuns();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Runs</h1>
          <p className="mt-1 text-sm text-text-muted">
            Each run kicks off 7 channels in parallel against a URL.
          </p>
        </div>
        <Link
          href="/ops/runs/new"
          className="inline-flex items-center justify-center rounded-md bg-wa-primary px-4 py-2 text-sm font-medium text-white hover:bg-wa-primary-dark"
        >
          + New run
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface shadow-sm">
        {runs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">
              No runs yet. Kick one off to see what Pam finds.
            </p>
            <Link
              href="/ops/runs/new"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-wa-primary px-4 py-2 text-sm font-medium text-white hover:bg-wa-primary-dark"
            >
              Start your first run
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">URL</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Started</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((run) => {
                const total = Object.values(run.jobs).length;
                const done = Object.values(run.jobs).filter(
                  (j) => j.status === "done" || j.status === "failed"
                ).length;
                const failed = Object.values(run.jobs).filter(
                  (j) => j.status === "failed"
                ).length;
                const status =
                  done === total
                    ? failed > 0
                      ? "completed with errors"
                      : "complete"
                    : `${done} / ${total} done`;
                return (
                  <tr key={run.id}>
                    <td className="px-6 py-3 font-medium text-text">
                      {run.customer}
                    </td>
                    <td className="px-6 py-3 text-text-muted">
                      <span className="font-mono text-xs">{run.hostname}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          done === total
                            ? failed > 0
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-text-muted">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/ops/runs/${run.id}`}
                        className="text-wa-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
