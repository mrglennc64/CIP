import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { channels, type Run } from "./types";

// Persistent JSON-file store. Designed for a single long-running Node process
// (VPS, Railway, Render, Fly, bare metal). Does NOT work on serverless hosts
// where the filesystem is per-isolate and ephemeral (Vercel functions,
// Cloudflare Workers, Lambda). Survives Node restarts on real disks.

const DATA_DIR = process.env.WAR_DATA_DIR || join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "runs.json");

declare global {
  var __waRunStore: Map<string, Run> | undefined;
}

/**
 * Backfill any channels that were added to the codebase after this run was
 * created. Without this, UI code iterating `channels` would crash on missing
 * entries in `run.jobs`. The stub job is marked done with an empty result.
 */
function backfillMissingChannels(run: Run): boolean {
  let mutated = false;
  for (const ch of channels) {
    if (!run.jobs[ch]) {
      run.jobs[ch] = {
        channel: ch,
        status: "done",
        result: {
          score: 0,
          summary: "(channel added after this run)",
          findings: [],
        },
      };
      mutated = true;
    }
  }
  return mutated;
}

function loadFromDisk(): Map<string, Run> {
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const obj = JSON.parse(raw) as Record<string, Run>;
    const m = new Map(Object.entries(obj));
    for (const run of m.values()) backfillMissingChannels(run);
    return m;
  } catch (err: unknown) {
    // ENOENT on first boot is expected. Anything else: warn but don't crash.
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") {
      console.warn(
        `[jobs/store] could not read ${STORE_PATH} (${code ?? "unknown"}); starting empty.`
      );
    }
    return new Map<string, Run>();
  }
}

const store: Map<string, Run> = globalThis.__waRunStore ?? loadFromDisk();
globalThis.__waRunStore = store;

function persist() {
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    // Atomic write: tmp file + rename. Prevents a half-written file if the
    // process is killed mid-write.
    const tmp = `${STORE_PATH}.tmp`;
    const obj = Object.fromEntries(store);
    writeFileSync(tmp, JSON.stringify(obj), "utf8");
    renameSync(tmp, STORE_PATH);
  } catch (err) {
    console.error(`[jobs/store] failed to persist to ${STORE_PATH}:`, err);
  }
}

export function saveRun(run: Run) {
  store.set(run.id, run);
  persist();
}

export function getRun(id: string): Run | undefined {
  return store.get(id);
}

export function listRuns(): Run[] {
  return [...store.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function newRunId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${ts}${rnd}`;
}
