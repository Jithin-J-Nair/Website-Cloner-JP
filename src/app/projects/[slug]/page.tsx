import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LUSION_PROJECT_DETAILS, getLusionProjectBySlug } from "@/data/reference";
import { LusionProjectDetailView } from "@/components/pages/LusionProjectDetailView";

interface ProjectDetailProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LUSION_PROJECT_DETAILS.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: ProjectDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const lusionProject = getLusionProjectBySlug(slug);
  if (!lusionProject) {
    return {
      title: {
        absolute: "Lusion - Page Not Found",
      },
    };
  }

  return {
    title: {
      absolute: lusionProject.meta.title,
    },
    description: lusionProject.meta.description,
    alternates: {
      canonical: lusionProject.route,
    },
    openGraph: {
      title: lusionProject.meta.ogTitle,
      description: lusionProject.meta.ogDescription,
      url: lusionProject.route,
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const lusionProject = getLusionProjectBySlug(slug);

  if (!lusionProject) {
    notFound();
  }

  return <LusionProjectDetailView project={lusionProject} />;
}
