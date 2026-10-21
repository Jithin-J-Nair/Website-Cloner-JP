import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./jrp.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jithinrp.com"),
  title: "Jithin RP — Senior Product Designer",
  description:
    "I designed products used by 5M+ people, turning complex workflows into measurable business growth.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Jithin RP",
    url: "/",
    title: "I design products used by 5M+ people",
    description:
      "Senior Product Designer in Melbourne. I turn complex workflows into measurable business growth.",
    images: [
      {
        url: "/sites/jithinrp/assets/og-cover.jpg",
        type: "image/jpeg",
        width: 1200,
        height: 630,
        alt: "Dark keyboard key with a white J — Jithin RP portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I design products used by 5M+ people",
    description:
      "Senior Product Designer in Melbourne. I turn complex workflows into measurable business growth.",
    images: ["/sites/jithinrp/assets/og-cover.jpg"],
  },
  icons: {
    icon: [
      { url: "/sites/jithinrp/assets/32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/sites/jithinrp/assets/48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/sites/jithinrp/assets/180x180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/* Marks the document as scripted before first paint (the reference does the same):
   without JS the clone stays readable instead of waiting behind the loader. */
const BOOT = "document.documentElement.classList.add('jrp-js','is-loading');";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/sites/jithinrp/fonts/Aeonik-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/sites/jithinrp/fonts/GeistPixel-VF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/sites/jithinrp/fonts/AwesomeSerifItalic-VF.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="jrp jrp-page min-h-full flex flex-col">{children}</body>
    </html>
  );
}
