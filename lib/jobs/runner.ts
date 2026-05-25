import { saveRun, getRun } from "./store";
import { channels, type Channel, type Run } from "./types";
import { runAudit } from "./audit";
import { runSeo } from "./seo";
import { runFunnel } from "./funnel";
import { runEmail } from "./email";
import { runDeliverability } from "./deliverability";
import { runSocial } from "./social";
import { runBrowser } from "./browser";

const handlers: Record<Channel, (url: string) => Promise<{
  score: number;
  summary: string;
  findings: import("./types").Finding[];
  details?: Record<string, unknown>;
}>> = {
  audit: runAudit,
  seo: runSeo,
  funnel: runFunnel,
  email: runEmail,
  deliverability: runDeliverability,
  social: runSocial,
  browser: runBrowser,
};

/**
 * Kick off all 5 jobs in parallel against the URL. Updates the run record
 * in the store as each job moves pending → running → done/failed.
 * Returns immediately; jobs continue in the background.
 */
export function startRun(run: Run) {
  for (const ch of channels) {
    void runChannel(run.id, ch, run.url);
  }
}

async function runChannel(runId: string, ch: Channel, url: string) {
  const begin = () => {
    const current = getRun(runId);
    if (!current) return;
    current.jobs[ch] = {
      ...current.jobs[ch],
      status: "running",
      startedAt: new Date().toISOString(),
    };
    saveRun(current);
  };
  const finish = (
    status: "done" | "failed",
    out: { result?: import("./types").JobResult; error?: string }
  ) => {
    const current = getRun(runId);
    if (!current) return;
    const finishedAt = new Date().toISOString();
    const startedAt = current.jobs[ch].startedAt ?? finishedAt;
    current.jobs[ch] = {
      ...current.jobs[ch],
      status,
      finishedAt,
      durationMs: Date.parse(finishedAt) - Date.parse(startedAt),
      result: out.result,
      error: out.error,
    };
    saveRun(current);
  };

  begin();
  try {
    const result = await handlers[ch](url);
    finish("done", { result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    finish("failed", { error: msg });
  }
}
