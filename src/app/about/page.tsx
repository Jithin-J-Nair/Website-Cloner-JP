import type { Metadata } from "next";
import { LUSION_ABOUT } from "@/data/reference";
import { AboutPageView } from "@/components/pages/AboutPageView";

export const metadata: Metadata = {
  title: {
    absolute: LUSION_ABOUT.meta.title,
  },
  description: LUSION_ABOUT.meta.description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: LUSION_ABOUT.meta.ogTitle,
    description: LUSION_ABOUT.meta.ogDescription,
    url: "/about",
  },
};

export default function AboutPage() {
  return <AboutPageView />;
}
