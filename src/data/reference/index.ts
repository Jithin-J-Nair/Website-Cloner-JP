/**
 * Strictly typed read-only accessor for verified Lusion reference ground truth.
 * Generated deterministically from the 22 captured HTML pages, CSS, team.json,
 * and binary asset headers by `scripts/extract-reference-data.mjs`.
 *
 * NOTE (Phase A): Existing UI components still read `src/data/studio.ts` untouched.
 * Phases B–E will wire UI components exclusively to this verified ground-truth module.
 */

import groundTruthJson from "./lusion-ground-truth.json";

export type LusionGroundTruth = typeof groundTruthJson;
export type LusionProjectCard = LusionGroundTruth["projectsArchive"]["projects"][number];
export type LusionProjectDetail = LusionGroundTruth["projectDetails"][number];
export type LusionTeamMember = LusionGroundTruth["about"]["who"]["team"][number];
export type LusionCapabilityCard = LusionGroundTruth["about"]["capability"]["cards"][number];

export const LUSION_GROUND_TRUTH: LusionGroundTruth = groundTruthJson;
export const LUSION_ROUTES = groundTruthJson.routes;
export const LUSION_TOKENS = groundTruthJson.tokens;
export const LUSION_GLOBAL_CHROME = groundTruthJson.globalChrome;
export const LUSION_HOME = groundTruthJson.home;
export const LUSION_ABOUT = groundTruthJson.about;
export const LUSION_PROJECTS_ARCHIVE = groundTruthJson.projectsArchive;
export const LUSION_PROJECT_DETAILS = groundTruthJson.projectDetails;

export function getLusionProjectBySlug(slug: string): LusionProjectDetail | undefined {
  return LUSION_PROJECT_DETAILS.find((project) => project.id === slug);
}
