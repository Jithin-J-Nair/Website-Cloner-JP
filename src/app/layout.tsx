import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StudioShell } from "@/components/foundation/StudioShell";
import { LUSION_HOME } from "@/data/reference";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f1fa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lusion.co"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: LUSION_HOME.meta.title,
    template: "Lusion - %s",
  },
  description: LUSION_HOME.meta.description,
  keywords: [
    "Lusion",
    "Creative Production Studio",
    "WebGL",
    "3D Visual Storytelling",
    "Interactive Web Experiences",
    "Bristol",
  ],
  authors: [{ name: "Lusion Creative Studio" }],
  openGraph: {
    title: LUSION_HOME.meta.title,
    description: LUSION_HOME.meta.description,
    type: "website",
    siteName: "Lusion",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lusionltd",
    title: LUSION_HOME.meta.title,
    description: LUSION_HOME.meta.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="is-white-bg">
      <body className="bg-[#f0f1fa] font-sans text-[#000000] antialiased selection:bg-[#1a2ffb] selection:text-white">
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}
