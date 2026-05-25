import type { NextRequest } from "next/server";
import { getRun } from "@/lib/jobs/store";
import { renderHealthReportPdf } from "@/lib/pdf/health-report";
import { rewriteToCarina } from "@/lib/pdf/carina-rewrite";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const carina = (await rewriteToCarina(run)) ?? undefined;
  const pdf = await renderHealthReportPdf(run, carina);
  const filename = `health-report-${run.hostname}-${run.id}.pdf`;
  // Cast Buffer to a BodyInit-compatible value (Uint8Array).
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
