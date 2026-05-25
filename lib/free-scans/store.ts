import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Free-scan submissions: tracks email → most recent scan, so we can enforce
// 1-scan-per-email-per-30-days without bloating the run store. Lives next to
// runs.json on the same disk; same atomic-write semantics.

const DATA_DIR = process.env.WAR_DATA_DIR || join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "free-scans.json");

export type FreeScanRecord = {
  email: string;
  runId: string;
  submittedAt: string;
  url: string;
};

declare global {
  var __waFreeScanStore: Map<string, FreeScanRecord> | undefined;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loadFromDisk(): Map<string, FreeScanRecord> {
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const obj = JSON.parse(raw) as Record<string, FreeScanRecord>;
    return new Map(Object.entries(obj));
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") {
      console.warn(
        `[free-scans/store] could not read ${STORE_PATH} (${code ?? "unknown"}); starting empty.`
      );
    }
    return new Map();
  }
}

const store: Map<string, FreeScanRecord> =
  globalThis.__waFreeScanStore ?? loadFromDisk();
globalThis.__waFreeScanStore = store;

function persist() {
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    const tmp = `${STORE_PATH}.tmp`;
    const obj = Object.fromEntries(store);
    writeFileSync(tmp, JSON.stringify(obj), "utf8");
    renameSync(tmp, STORE_PATH);
  } catch (err) {
    console.error(`[free-scans/store] failed to persist to ${STORE_PATH}:`, err);
  }
}

export const RATE_LIMIT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getRecentScanForEmail(email: string): FreeScanRecord | null {
  const rec = store.get(normalizeEmail(email));
  if (!rec) return null;
  const ageMs = Date.now() - new Date(rec.submittedAt).getTime();
  return ageMs < RATE_LIMIT_MS ? rec : null;
}

export function recordFreeScan(rec: FreeScanRecord): void {
  store.set(normalizeEmail(rec.email), rec);
  persist();
}
