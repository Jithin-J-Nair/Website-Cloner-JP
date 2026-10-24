import type { Metadata } from "next";
import { DesignSystemView } from "@/components/pages/DesignSystemView";

export const metadata: Metadata = {
  title: "Design System — Lusion",
  description:
    "Living token documentation, surface palette architecture, fluid grotesque type scale, motion curves, and interactive studio primitives.",
};

export default function DesignSystemPage() {
  return <DesignSystemView />;
}
