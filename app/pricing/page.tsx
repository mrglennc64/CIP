import type { Metadata } from "next";
import { PricingView } from "./PricingView";

export const metadata: Metadata = {
  title: "Pricing — Web Assessment Agency",
  description:
    "Three monthly tiers priced in SEK — Starter, Standard, and Professional.",
};

export default function PricingPage() {
  return <PricingView />;
}
