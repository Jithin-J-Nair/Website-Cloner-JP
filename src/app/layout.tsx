import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StudioShell } from "@/components/foundation/StudioShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f1fa" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "JITHIN",
    template: "JITHIN - %s",
  },
  description: "3D visual storytelling and interactive web experiences by Jithin.",
  keywords: [
    "Jithin",
    "Creative Production",
    "WebGL",
    "3D Visual Storytelling",
    "Interactive Web Experiences",
  ],
  authors: [{ name: "Jithin" }],
  openGraph: {
    title: "JITHIN",
    description: "3D visual storytelling and interactive web experiences by Jithin.",
    type: "website",
    siteName: "JITHIN",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "JITHIN",
    description: "3D visual storytelling and interactive web experiences by Jithin.",
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
