import type { Metadata } from "next";
import { PortalView } from "./PortalView";

export const metadata: Metadata = {
  title: "Dashboard — Northern Star · CIP",
};

export default function PortalPage() {
  return <PortalView />;
}
