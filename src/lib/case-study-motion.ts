import { homeRenderDpr } from "./home-motion";

/** ProjectDetailsScreen consumes ScrollPane.scrollViewDelta, not an accumulated
 * velocity. Lenis has already smoothed the document position. Integrating again
 * multiplies the eight-tap trail and leaves distortion after scrolling stops. */
export function caseStudyScrollStrength(viewDelta: number, reduced = false): number {
  return reduced || !Number.isFinite(viewDelta) ? 0 : Math.max(-.15, Math.min(.15, viewDelta));
}

/** Match the media pass to the presentation buffer. Keep the shared UHD / 2x
 * budget and GPU texture limit, not the old unconditional 1.4MP downsample. */
export function caseStudyRenderDpr(width: number, height: number, deviceDpr: number, maxTextureSize: number): number {
  return Math.min(homeRenderDpr(width, height, deviceDpr), maxTextureSize / Math.max(1, width), maxTextureSize / Math.max(1, height));
}
