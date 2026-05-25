import { NextResponse, type NextRequest } from "next/server";
import { getRun } from "@/lib/jobs/store";
import { makeShareUrl } from "@/lib/share-link";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const secret = process.env.OPS_AUTH_SECRET;
  let share: { path: string; expiresAt: number } | null = null;
  if (secret) {
    share = await makeShareUrl(run.id, secret);
  }

  return NextResponse.json({ run, share });
}
