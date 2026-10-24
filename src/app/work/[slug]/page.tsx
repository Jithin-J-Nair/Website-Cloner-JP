import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STUDIO_PROJECTS } from "@/data/studio";
import { CaseStudyView } from "@/components/pages/CaseStudyView";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return STUDIO_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = STUDIO_PROJECTS.find((p) => p.slug === slug);
  if (!project) {
    return { title: "Project Not Found" };
  }
  return {
    title: `${project.title} — Case Study`,
    description: project.tagline,
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const idx = STUDIO_PROJECTS.findIndex((p) => p.slug === slug);
  if (idx === -1) {
    notFound();
  }

  const project = STUDIO_PROJECTS[idx];
  const nextProject = STUDIO_PROJECTS[(idx + 1) % STUDIO_PROJECTS.length];

  return <CaseStudyView project={project} nextProject={nextProject} />;
}
