import { redirect } from "next/navigation";

interface WorkAliasProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkAliasPage({ params }: WorkAliasProps): Promise<never> {
  const { slug } = await params;
  redirect("/projects/" + encodeURIComponent(slug));
}
