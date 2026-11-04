#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const source = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8"));
const archive = source.projectsArchive;
const projects = archive.projects;
const details = source.projectDetails;
const page = fs.readFileSync("src/components/pages/ProjectsArchiveView.tsx", "utf8");
const card = fs.readFileSync("src/components/home/FeaturedProjectCard.tsx", "utf8");
const detail = fs.readFileSync("src/components/pages/LusionProjectDetailView.tsx", "utf8");

assert.equal(archive.heading, "PROJECTS");
assert.equal(Number(archive.displayedCount), projects.length, "archive count matches its rendered project entries");
assert.equal(details.length, projects.length, "every archive entry has a detail route");
assert.equal(new Set(projects.map(project => project.id)).size, projects.length, "archive IDs are unique");

const byId = new Map(details.map(project => [project.id, project]));
for (const project of projects) {
  assert.equal(project.href, `/projects/${project.id}`, `canonical archive route for ${project.id}`);
  assert.match(project.thumbnail, new RegExp(`^/assets/projects/${project.id}/`), `project-owned thumbnail for ${project.id}`);
  const detailPage = byId.get(project.id);
  assert.ok(detailPage, `detail content exists for ${project.id}`);
  assert.equal(detailPage.route, project.href, `detail route matches archive route for ${project.id}`);
  assert.ok(detailPage.media.length > 0, `detail page has real media for ${project.id}`);
  assert.equal(detailPage.mediaCount, detailPage.media.length, `media count is accurate for ${project.id}`);
  for (const item of detailPage.media) {
    if (item.desktopSrc) assert.match(item.desktopSrc, /^\/assets\/projects\//);
    if (item.mobileSrc) assert.match(item.mobileSrc, /^\/assets\/projects\//);
    if (item.type === "video") assert.ok(item.declaredWidth > 0 && item.declaredHeight > 0);
  }
  assert.ok(byId.has(detailPage.nextProject.id), `next-project chain stays inside canonical project routes for ${project.id}`);
  assert.equal(detailPage.nextProject.href, `/projects/${detailPage.nextProject.id}`);
}

assert.match(page, /LUSION_PROJECTS_ARCHIVE\.projects\.map/);
assert.match(page, /id="projects-title"/);
assert.match(page, /id="projects-count"/);
assert.match(page, /id="projects-list"/);
assert.match(page, /min-\[813px\]:text-\[17vw\]/, "desktop title scale is matched to the reference capture");
assert.match(page, /min-\[813px\]:pt-\[28vh\]/, "desktop title begins at the reference vertical position");
assert.match(page, /min-\[813px\]:mt-\[8\.25rem\]/, "first project row keeps the intended breathing room");
assert.match(page, /min-\[813px\]:h-14 min-\[813px\]:w-14/, "desktop directional arrow keeps the reference scale");
assert.match(page, /grid-cols-6[\s\S]*min-\[813px\]:grid-cols-12/, "archive grid adapts from mobile to desktop");

assert.match(card, /href=\{project\.href\}/, "cards navigate to the canonical project route");
assert.match(card, /onPointerMove=\{handlePointerMove\}/, "desktop thumbnail parallax remains interactive");
assert.match(card, /reducedMotion/, "thumbnail parallax respects reduced motion");
assert.match(card, /onFocus=\{\(\) => setHovered\(true\)\}/, "keyboard focus has the same reveal state as pointer hover");
assert.match(card, /project\.thumbnail/, "cards use the source project thumbnail");

assert.match(detail, /project\.media\.slice\(1\)/);
assert.match(detail, /onError=\{\(\) => setVideoFailed\(true\)\}/, "video failure has a media fallback");
assert.match(detail, /<source media="\(max-width: 812px\)"/);
assert.match(detail, /project\.nextProject\.href/, "detail navigation leads to the next canonical case study");
assert.match(detail, /onKeyDown/, "interactive video previews support keyboard activation");

console.log(`PASS Projects archive + detail data: ${projects.length} canonical routes, source-owned thumbnails/media, next-project chain, responsive grid and accessible pointer/keyboard interactions.`);
