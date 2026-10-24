import type { Metadata } from "next";
import { WorkArchiveView } from "@/components/pages/WorkArchiveView";

export const metadata: Metadata = {
  title: "Selected Projects",
  description:
    "Explore KINETA's archive of real-time 3D web experiences, optical shader campaigns, autonomous digital twins, and WebXR installations.",
};

export default function WorkPage() {
  return <WorkArchiveView />;
}
