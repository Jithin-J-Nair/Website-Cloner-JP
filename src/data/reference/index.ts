/**
 * Runtime Lusion reference data.
 *
 * `lusion-ground-truth.json` remains the immutable September capture.
 * `current-live-projects.json` adds verified current archive content without
 * rewriting the historical capture, then assembles the active route/data lists.
 */
import groundTruthJson from "./lusion-ground-truth.json";
import currentLiveProjects from "./current-live-projects.json";

export type LusionGroundTruth = typeof groundTruthJson;
export type LusionProjectCard = LusionGroundTruth["projectsArchive"]["projects"][number];
export type LusionProjectDetail = LusionGroundTruth["projectDetails"][number];
export type LusionTeamMember = LusionGroundTruth["about"]["who"]["team"][number];
export type LusionCapabilityCard = LusionGroundTruth["about"]["capability"]["cards"][number];

const categoryOverrides = currentLiveProjects.categoryOverrides as Record<
  string,
  { categoriesText: string; categories: string[] }
>;
const applyCurrentCategories = <T extends { id: string; categoriesText: string; categories: string[] }>(project: T): T => {
  const override = categoryOverrides[project.id];
  return override ? { ...project, ...override } : project;
};

const cardEntries: Array<[string, LusionProjectCard]> = [
  ...groundTruthJson.projectsArchive.projects.map((project): [string, LusionProjectCard] => {
    const current = applyCurrentCategories(project);
    return [current.id, current];
  }),
  ...currentLiveProjects.projects.map((project): [string, LusionProjectCard] => {
    const current = applyCurrentCategories(project.card);
    return [current.id, current];
  })
];
const detailEntries: Array<[string, LusionProjectDetail]> = [
  ...groundTruthJson.projectDetails.map((project): [string, LusionProjectDetail] => {
    const current = applyCurrentCategories(project);
    return [current.id, current];
  }),
  ...currentLiveProjects.projects.map((project): [string, LusionProjectDetail] => {
    const current = applyCurrentCategories(project.detail);
    return [current.id, current];
  })
];

// Supplied opening film shows a charcoal Atlas page, unlike the older light
// capture. #181818 is an approximation of compressed film pixels, not a verified
// live CSS token. Keep the captures intact; apply one coherent runtime theme to
// the card fog, case/chrome, and previous project's incoming preview.
const atlasFilmTheme = { colorBg: "#181818", colorText: "#ffffff", colorHighlight: "#ffffff" };
const cardsById = new Map<string, LusionProjectCard>(cardEntries.map(([id, card]) => [id, id === "atlas_motion" ? { ...card, colorBg: atlasFilmTheme.colorBg, colorText: atlasFilmTheme.colorText } : card]));
const applyAtlasFilmTheme = <T extends { id: string; theme: { colorBg: string; colorText: string; colorHighlight: string } }>(project: T): T => project.id === "atlas_motion" ? { ...project, theme: { ...project.theme, ...atlasFilmTheme } } : project;
const detailsById = new Map<string, LusionProjectDetail>(detailEntries.map(([id, detail]) => [id, applyAtlasFilmTheme(detail)]));
const featuredIndexById = new Map<string, number>(
  currentLiveProjects.featuredOrder.map((id, index): [string, number] => [id, index + 1])
);

const archiveProjects = currentLiveProjects.archiveOrder.map((id) => {
  const project = cardsById.get(id);
  if (!project) throw new Error(`Missing current Lusion archive card: ${id}`);
  return project;
});
const featuredProjects = currentLiveProjects.featuredOrder.map((id) => {
  const project = cardsById.get(id);
  if (!project) throw new Error(`Missing current Lusion featured card: ${id}`);
  return project;
});

const projectDetails = currentLiveProjects.archiveOrder.map((id, index) => {
  const project = detailsById.get(id);
  const nextId = currentLiveProjects.archiveOrder[(index + 1) % currentLiveProjects.archiveOrder.length];
  const nextProject = detailsById.get(nextId);
  if (!project || !nextProject) {
    throw new Error(`Missing current Lusion project detail while assembling route: ${id}`);
  }
  return {
    ...project,
    archiveIndex: index + 1,
    isFeatured: featuredIndexById.has(id),
    featuredIndex: featuredIndexById.get(id) ?? null,
    nextProject: {
      id: nextProject.id,
      href: nextProject.route,
      title: nextProject.title,
      label: project.nextProject?.label ?? "NEXT PROJECT",
      colorBg: nextProject.theme.colorBg,
      colorText: nextProject.theme.colorText,
      shadow: nextProject.theme.shadow
    }
  };
});

const projectRoutes = projectDetails.map((project) => ({
  route: project.route,
  type: "project-detail",
  sourceHtml: project.sourceHtml,
  title: project.meta.title,
  projectId: project.id
}));
const routes = [
  ...groundTruthJson.routes.filter((route) => route.type !== "project-detail"),
  ...projectRoutes
];

export const LUSION_GROUND_TRUTH = {
  ...groundTruthJson,
  routeCount: routes.length,
  routes,
  home: {
    ...groundTruthJson.home,
    featured: {
      ...groundTruthJson.home.featured,
      count: featuredProjects.length,
      projects: featuredProjects
    }
  },
  projectsArchive: {
    ...groundTruthJson.projectsArchive,
    count: archiveProjects.length,
    displayedCount: String(archiveProjects.length),
    projects: archiveProjects
  },
  projectDetails
} as LusionGroundTruth;

export const LUSION_ROUTES = LUSION_GROUND_TRUTH.routes;
export const LUSION_TOKENS = LUSION_GROUND_TRUTH.tokens;
export const LUSION_GLOBAL_CHROME = LUSION_GROUND_TRUTH.globalChrome;
export const LUSION_HOME = LUSION_GROUND_TRUTH.home;
export const LUSION_ABOUT = LUSION_GROUND_TRUTH.about;
export const LUSION_PROJECTS_ARCHIVE = LUSION_GROUND_TRUTH.projectsArchive;
export const LUSION_PROJECT_DETAILS = LUSION_GROUND_TRUTH.projectDetails;

export function getLusionProjectBySlug(slug: string): LusionProjectDetail | undefined {
  return LUSION_PROJECT_DETAILS.find((project) => project.id === slug);
}
