#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadCurrentLiveGroundTruth } from "./lib/load-ground-truth.mjs";

const source = loadCurrentLiveGroundTruth();
const archive = source.projectsArchive;
const projects = archive.projects;
const details = source.projectDetails;
const page = fs.readFileSync("src/components/pages/ProjectsArchiveView.tsx", "utf8");
const card = fs.readFileSync("src/components/home/FeaturedProjectCard.tsx", "utf8");
const detail = fs.readFileSync("src/components/pages/LusionProjectDetailView.tsx", "utf8");

const expectedArchiveIds = [
  "oryzo_ai", "atlas_motion", "devin_ai", "of_the_oak", "everswap",
  "porsche_dream_machine", "synthetic_human", "ddd_2024", "spaace",
  "choo_choo_world", "zero_tech", "spatial_fusion", "worldcoin",
  "lusion_labs", "my_little_story_book", "soda_experience",
  "infinite_passerella", "the_turn_of_the_screw", "maxmara_bearings_gifts",
];
const expectedFeaturedIds = [
  "oryzo_ai", "atlas_motion", "devin_ai", "of_the_oak", "everswap",
  "porsche_dream_machine", "synthetic_human", "spatial_fusion", "spaace",
  "ddd_2024", "choo_choo_world", "soda_experience",
];

assert.equal(archive.heading, "PROJECTS");
assert.equal(Number(archive.displayedCount), 19, "live archive displays 19 projects");
assert.equal(archive.count, 19);
assert.deepEqual(projects.map(project => project.id), expectedArchiveIds, "archive order matches current Lusion");
assert.equal(details.length, projects.length, "every current archive entry has a detail route");
assert.equal(source.routeCount, 22);
assert.deepEqual(source.routes.filter(route => route.type === "project-detail").map(route => route.projectId), expectedArchiveIds);
assert.equal(new Set(projects.map(project => project.id)).size, projects.length, "archive IDs are unique");
assert.equal(source.home.featured.count, 12, "live Home Featured Work displays 12 items");
assert.deepEqual(source.home.featured.projects.map(project => project.id), expectedFeaturedIds, "Home Featured Work matches current Lusion order");
const atlasCard = projects.find(project => project.id === "atlas_motion");
const atlasDetail = details.find(project => project.id === "atlas_motion");
assert.equal(atlasCard?.categoriesText, "concept • web • design • development • 3d • animation", "Atlas Motion homepage/archive category label matches live Lusion");
assert.deepEqual(atlasCard?.categories, ["concept", "web", "design", "development", "3d", "animation"]);
assert.equal(atlasDetail?.categoriesText, atlasCard?.categoriesText, "Atlas Motion detail metadata stays synchronized with its archive card");
const porsche = details.find(project => project.id === "porsche_dream_machine");
assert.equal(porsche?.launchCta?.label, "Watch Video", "Porsche uses the current live film CTA label");
assert.equal(porsche?.launchCta?.href, "https://player.vimeo.com/video/783015830", "Porsche links directly to its current Vimeo player");
assert.equal(porsche?.launchCta?.isVimeoOverlay, false, "Porsche's Vimeo player remains a direct external link");
const categoriesById = Object.fromEntries(projects.map(project => [project.id, project.categoriesText]));
assert.deepEqual(categoriesById, {
  "oryzo_ai": "concept • web • design • development • 3d • animation",
  "atlas_motion": "concept • web • design • development • 3d • animation",
  "devin_ai": "web • design • development • 3d",
  "of_the_oak": "web • design • development • 3d • animation",
  "everswap": "concept • web • design • development • 3d • animation",
  "porsche_dream_machine": "concept • 3D illustration • mograph • video",
  "synthetic_human": "web • design • development • 3d",
  "ddd_2024": "web • design • development • 3d",
  "spaace": "web • design • development • 3d • web3",
  "choo_choo_world": "concept • web • game design • 3d",
  "zero_tech": "web • design • development • 3d",
  "spatial_fusion": "api design • webgl • 3d",
  "worldcoin": "web • design • development • 3d",
  "lusion_labs": "concept • web • design • development • 3d",
  "my_little_story_book": "concept • design • development • 3d",
  "soda_experience": "AR • development • 3d",
  "infinite_passerella": "concept • design • development • 3d",
  "the_turn_of_the_screw": "design • development • 3d",
  "maxmara_bearings_gifts": "development • 3D"
}, "all current archive category labels match the live Lusion archive");
for (const [id, categoriesText] of Object.entries({"oryzo_ai":"concept • web • design • development • 3d • animation","atlas_motion":"concept • web • design • development • 3d • animation","devin_ai":"web • design • development • 3d","of_the_oak":"web • design • development • 3d • animation","everswap":"concept • web • design • development • 3d • animation","porsche_dream_machine":"concept • 3D illustration • mograph • video","synthetic_human":"web • design • development • 3d","ddd_2024":"web • design • development • 3d","spaace":"web • design • development • 3d • web3","choo_choo_world":"concept • web • game design • 3d","zero_tech":"web • design • development • 3d","spatial_fusion":"api design • webgl • 3d","worldcoin":"web • design • development • 3d","lusion_labs":"concept • web • design • development • 3d","my_little_story_book":"concept • design • development • 3d","soda_experience":"AR • development • 3d","infinite_passerella":"concept • design • development • 3d","the_turn_of_the_screw":"design • development • 3d","maxmara_bearings_gifts":"development • 3D"})) {
  const detailPage = details.find(project => project.id === id);
  assert.equal(detailPage?.categoriesText, categoriesText, `current project detail category metadata is synchronized for ${id}`);
}
const unavailableLaunchDestinations = details
  .filter(project => !project.launchCta?.href?.trim() && !project.launchCta?.isVimeoOverlay)
  .map(project => project.id);
assert.deepEqual(unavailableLaunchDestinations, ["soda_experience", "maxmara_bearings_gifts"], "only the two live labels without exposed destinations stay non-navigating");
const atlas = details.find(project => project.id === "atlas_motion");
assert.ok(atlas?.links.some(link => link.label === "Launch Project" && link.href === "https://atlasmotion.com/"), "Atlas links block repeats the live Launch Project destination");
assert.equal(atlas?.categoriesText, "concept • web • design • development • 3d", "Atlas card tags match the current live archive");

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
assert.match(detail, /if \(!project\.launchCta\.href\?\.trim\(\) && !project\.launchCta\.isVimeoOverlay\)/, "empty launch URLs must not become self-links");
assert.match(detail, /data-launch-unavailable="true"/, "missing launch destinations remain visible without a fake link");
assert.match(detail, /onError=\{\(\) => setVideoFailed\(true\)\}/, "video failure has a media fallback");
assert.match(detail, /<source media="\(max-width: 812px\)"/);
assert.match(detail, /project\.nextProject\.href/, "detail navigation leads to the next canonical case study");
assert.match(detail, /onKeyDown/, "interactive video previews support keyboard activation");

console.log(`PASS Projects archive + detail data: ${projects.length} canonical routes, source-owned thumbnails/media, next-project chain, responsive grid and accessible pointer/keyboard interactions.`);
