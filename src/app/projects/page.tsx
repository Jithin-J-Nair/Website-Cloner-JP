import type { Metadata } from "next";
import { LUSION_PROJECTS_ARCHIVE } from "@/data/reference";
import { ProjectsArchiveView } from "@/components/pages/ProjectsArchiveView";

export const metadata: Metadata = {
  title: {
    absolute: LUSION_PROJECTS_ARCHIVE.meta.title,
  },
  description: LUSION_PROJECTS_ARCHIVE.meta.description,
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: LUSION_PROJECTS_ARCHIVE.meta.ogTitle,
    description: LUSION_PROJECTS_ARCHIVE.meta.ogDescription,
    url: "/projects",
  },
};

export default function ProjectsPage() {
  return <ProjectsArchiveView />;
}
