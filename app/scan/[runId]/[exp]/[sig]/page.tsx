import type { Metadata } from "next";
import { getRun } from "@/lib/jobs/store";
import { verifyShareToken } from "@/lib/share-link";
import { ScanTeaserView } from "./ScanTeaserView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free scan — Web Assessment Agency",
  robots: { index: false, follow: false },
};

type Params = { runId: string; exp: string; sig: string };

export default async function FreeScanPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { runId, exp, sig } = await params;
  const secret = process.env.OPS_AUTH_SECRET;

  if (!secret) {
    return (
      <Unavailable
        titleEn="Free scan unavailable"
        titleSv="Gratis skanning ej tillgänglig"
        bodyEn="The server is not fully configured."
        bodySv="Servern är inte fullständigt konfigurerad."
      />
    );
  }

  const verdict = await verifyShareToken(runId, exp, sig, secret);
  if (!verdict.valid) {
    return (
      <Unavailable
        titleEn={
          verdict.reason === "expired" ? "Link expired" : "Link unavailable"
        }
        titleSv={
          verdict.reason === "expired" ? "Länken har gått ut" : "Länken ogiltig"
        }
        bodyEn={
          verdict.reason === "expired"
            ? "This free-scan link has expired. Request a new scan from the homepage."
            : "This link is invalid or has been tampered with."
        }
        bodySv={
          verdict.reason === "expired"
            ? "Den här gratisskannings-länken har gått ut. Begär en ny skanning från startsidan."
            : "Länken är ogiltig eller har manipulerats."
        }
      />
    );
  }

  const run = getRun(runId);
  if (!run) {
    return (
      <Unavailable
        titleEn="Scan not found"
        titleSv="Skanning hittades inte"
        bodyEn="This scan is no longer available."
        bodySv="Den här skanningen är inte längre tillgänglig."
      />
    );
  }

  return <ScanTeaserView run={run} />;
}

function Unavailable({
  titleEn,
  titleSv,
  bodyEn,
  bodySv,
}: {
  titleEn: string;
  titleSv: string;
  bodyEn: string;
  bodySv: string;
}) {
  return (
    <UnavailableClient
      titleEn={titleEn}
      titleSv={titleSv}
      bodyEn={bodyEn}
      bodySv={bodySv}
    />
  );
}

// Imported as separate file so the server page above can stay server-only
// for the verification path. The fallback is rendered via the client wrapper
// so it picks up the active locale.
import { UnavailableClient } from "./UnavailableClient";
