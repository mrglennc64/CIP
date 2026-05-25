import { NextResponse, type NextRequest } from "next/server";
import { listRuns, newRunId, saveRun } from "@/lib/jobs/store";
import { channels, type Run } from "@/lib/jobs/types";
import { startRun } from "@/lib/jobs/runner";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ runs: listRuns() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    url?: string;
    customer?: string;
    plan?: Run["plan"];
  };

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "Only http(s) URLs are supported" }, { status: 400 });
  }

  const id = newRunId();
  const run: Run = {
    id,
    url: url.toString(),
    hostname: url.hostname,
    customer: (body.customer ?? "").trim() || url.hostname,
    plan: body.plan ?? "Standard",
    createdAt: new Date().toISOString(),
    jobs: Object.fromEntries(
      channels.map((ch) => [ch, { channel: ch, status: "pending" as const }])
    ) as Run["jobs"],
  };
  saveRun(run);
  startRun(run);

  return NextResponse.json({ run }, { status: 201 });
}
