import type { Metadata } from "next";
import { ReportsView } from "./ReportsView";

export const metadata: Metadata = {
  title: "Weekly Reports — Northern Star · CIP",
  description:
    "Weekly assessment reports — structured PDFs covering content, payments, email, and monitoring.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
