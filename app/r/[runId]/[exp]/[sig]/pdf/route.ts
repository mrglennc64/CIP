import type { NextRequest } from "next/server";
import { getRun } from "@/lib/jobs/store";
import { renderHealthReportPdf } from "@/lib/pdf/health-report";
import { rewriteToCarina } from "@/lib/pdf/carina-rewrite";
import { verifyShareToken } from "@/lib/share-link";

export const runtime = "nodejs";
export const maxDuration = 60;

function plainText(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string; exp: string; sig: string }> }
) {
  const { runId, exp, sig } = await params;
  const secret = process.env.OPS_AUTH_SECRET;
  if (!secret) {
    return plainText("Share links are not configured on this server.", 500);
  }

  const verdict = await verifyShareToken(runId, exp, sig, secret);
  if (!verdict.valid) {
    const msg =
      verdict.reason === "expired"
        ? "This share link has expired."
        : verdict.reason === "malformed"
          ? "This share link is malformed."
          : "This share link is invalid.";
    return plainText(
      `${msg}\n\nIf you still need the report, contact your account manager for a fresh link.`,
      410
    );
  }

  const run = getRun(runId);
  if (!run) return plainText("Report not found.", 404);

  const carina = (await rewriteToCarina(run)) ?? undefined;
  const pdf = await renderHealthReportPdf(run, carina);
  const filename = `health-report-${run.hostname}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      // Inline so it opens in the browser's PDF viewer; users can still
      // save it with Ctrl/Cmd-S.
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
