import type { Metadata } from "next";
import { LabsPageView } from "@/components/pages/LabsPageView";

export const metadata: Metadata = {
  title: "Labs R&D — Optical & Physics Sandbox",
  description:
    "Interactive WebGL laboratory showcasing Lusion's real-time Snell's Law dispersion shaders, curl-noise swarms, and damped spring physics.",
};

export default function LabsPage() {
  return <LabsPageView />;
}
