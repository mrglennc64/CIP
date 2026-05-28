import type { Metadata } from "next";
import { HowItWorksView } from "./HowItWorksView";

export const metadata: Metadata = {
  title: "How it works — Northern Star · CIP",
  description:
    "Six steps from kickoff to weekly cadence. Read-only access, tenant sign-off on every change, structured PDF report every Friday.",
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
