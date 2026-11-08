import fs from "node:fs";
import path from "node:path";

export function mergeCurrentLiveGroundTruth(base, extension) {
  const categoryOverrides = extension.categoryOverrides ?? {};
  const applyCurrentCategories = (project) => {
    const override = categoryOverrides[project.id];
    return override ? { ...project, ...override } : project;
  };
  const cardsById = new Map([
    ...base.projectsArchive.projects.map((project) => {
      const current = applyCurrentCategories(project);
      return [current.id, current];
    }),
    ...extension.projects.map(({ card }) => {
      const current = applyCurrentCategories(card);
      return [current.id, current];
    })
  ]);
  const detailsById = new Map([
    ...base.projectDetails.map((project) => {
      const current = applyCurrentCategories(project);
      return [current.id, current];
    }),
    ...extension.projects.map(({ detail }) => {
      const current = applyCurrentCategories(detail);
      return [current.id, current];
    })
  ]);

  const featuredIndexById = new Map(extension.featuredOrder.map((id, index) => [id, index + 1]));

  const archiveProjects = extension.archiveOrder.map((id) => {
    const project = cardsById.get(id);
    if (!project) throw new Error(`Missing current Lusion archive card: ${id}`);
    return project;
  });
  const featuredProjects = extension.featuredOrder.map((id) => {
    const project = cardsById.get(id);
    if (!project) throw new Error(`Missing current Lusion featured card: ${id}`);
    return project;
  });
  const projectDetails = extension.archiveOrder.map((id, index) => {
    const project = detailsById.get(id);
    const nextId = extension.archiveOrder[(index + 1) % extension.archiveOrder.length];
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
  const routes = [
    ...base.routes.filter((route) => route.type !== "project-detail"),
    ...projectDetails.map((project) => ({
      route: project.route,
      type: "project-detail",
      sourceHtml: project.sourceHtml,
      title: project.meta.title,
      projectId: project.id
    }))
  ];

  return {
    ...base,
    routeCount: routes.length,
    routes,
    home: {
      ...base.home,
      featured: {
        ...base.home.featured,
        count: featuredProjects.length,
        projects: featuredProjects
      }
    },
    projectsArchive: {
      ...base.projectsArchive,
      count: archiveProjects.length,
      displayedCount: String(archiveProjects.length),
      projects: archiveProjects
    },
    projectDetails
  };
}

export function loadCurrentLiveGroundTruth(root = process.cwd()) {
  const basePath = path.join(root, "src", "data", "reference", "lusion-ground-truth.json");
  const extensionPath = path.join(root, "src", "data", "reference", "current-live-projects.json");
  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const extension = JSON.parse(fs.readFileSync(extensionPath, "utf8"));
  return mergeCurrentLiveGroundTruth(base, extension);
}
