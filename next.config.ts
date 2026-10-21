import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  /* The clone is a faithful replica; keep the dev overlay out of preview screenshots. */
  devIndicators: false,
  /* Dev-only: the sandbox preview proxies the app from another origin, so keep its
     dev resources (HMR stream, compiled chunks) reachable from there. */
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.e2b.app",
    "*.arena.ai",
  ],
};

export default nextConfig;
