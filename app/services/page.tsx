import type { Metadata } from "next";
import { ServicesView } from "./ServicesView";

export const metadata: Metadata = {
  title: "Services — Northern Star · CIP",
  description:
    "Six structured services: website assessment, payment A/B testing, email review, weekly social content, before/after report, and platform monitoring.",
};

export default function ServicesPage() {
  return <ServicesView />;
}
