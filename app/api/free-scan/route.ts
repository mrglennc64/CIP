import { NextResponse, type NextRequest } from "next/server";
import { listRuns, newRunId, saveRun } from "@/lib/jobs/store";
import { channels, type Run } from "@/lib/jobs/types";
import { startRun } from "@/lib/jobs/runner";
import { makeShareUrl } from "@/lib/share-link";
import {
  getRecentScanForEmail,
  recordFreeScan,
  RATE_LIMIT_MS,
} from "@/lib/free-scans/store";
import { isAdminEmail } from "@/lib/admin-emails";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function daysUntilNextScan(submittedAt: string): number {
  const ageMs = Date.now() - new Date(submittedAt).getTime();
  return Math.ceil((RATE_LIMIT_MS - ageMs) / (24 * 60 * 60 * 1000));
}

async function buildScanUrl(
  runId: string,
  admin: boolean
): Promise<string | null> {
  const secret = process.env.OPS_AUTH_SECRET;
  if (!secret) return null;
  const { path } = await makeShareUrl(runId, secret);
  // Admins go straight to /r/... (full report). Public free scans get the
  // /scan/... teaser with only 2 critical + 1 watch finding unlocked.
  if (admin) return path;
  return path.replace(/^\/r\//, "/scan/");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    url?: string;
  };

  const email = (body.email ?? "").trim();
  const rawUrl = (body.url ?? "").trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!rawUrl) {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http(s) URLs are supported." },
      { status: 400 }
    );
  }

  const admin = isAdminEmail(email);
  if (!admin) {
    const existing = getRecentScanForEmail(email);
    if (existing) {
      const scanUrl = await buildScanUrl(existing.runId, false);
      return NextResponse.json(
        {
          error: "rate_limited",
          daysUntilNext: daysUntilNextScan(existing.submittedAt),
          previousScanUrl: scanUrl,
        },
        { status: 429 }
      );
    }
  }

  const id = newRunId();
  const run: Run = {
    id,
    url: url.toString(),
    hostname: url.hostname,
    customer: url.hostname,
    plan: "Starter",
    createdAt: new Date().toISOString(),
    jobs: Object.fromEntries(
      channels.map((ch) => [ch, { channel: ch, status: "pending" as const }])
    ) as Run["jobs"],
  };
  saveRun(run);
  startRun(run);

  recordFreeScan({
    email,
    runId: id,
    submittedAt: run.createdAt,
    url: run.url,
  });

  const scanUrl = await buildScanUrl(id, admin);
  if (!scanUrl) {
    // Share links require OPS_AUTH_SECRET. Without it, return the run id
    // so the page can still be reached via the operator route if needed.
    return NextResponse.json(
      {
        runId: id,
        warning:
          "Server is missing OPS_AUTH_SECRET; scan started but no share link.",
      },
      { status: 201 }
    );
  }

  // Note: count of recent runs is just for ops visibility, not exposed.
  void listRuns;

  return NextResponse.json({ scanUrl }, { status: 201 });
}
