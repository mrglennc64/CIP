import type { Metadata } from "next";
import { PortalView } from "./PortalView";

export const metadata: Metadata = {
  title: "Dashboard — Web Assessment Agency",
};

export default function PortalPage() {
  return <PortalView />;
}
