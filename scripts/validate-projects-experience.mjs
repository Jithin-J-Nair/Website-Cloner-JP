#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { launchMotionBrowser } from "./lib/browser-runtime.mjs";

const base = process.env.PROJECTS_EXPERIENCE_BASE || "http://127.0.0.1:3000";
const out = process.env.PROJECTS_EXPERIENCE_OUT || "temp/projects-experience";
fs.mkdirSync(out, { recursive: true });

const source = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8"));
const archive = source.projectsArchive;
const projects = archive.projects;
const details = source.projectDetails;
const expectedArchive = projects.map(project => project.href);
const expectedFeatured = source.home.featured.projects.map(project => project.href);

assert.equal(source.routeCount, 20);
assert.equal(projects.length, 17);
assert.equal(details.length, 17);
assert.equal(source.home.featured.count, 10);
assert.equal(source.home.featured.projects.length, 10);

const browser = await launchMotionBrowser();
const report = { base, routeCount: source.routeCount, archiveCount: projects.length, featuredCount: expectedFeatured.length, viewports: [] };
try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900, isMobile: false },
    { name: "mobile", width: 390, height: 844, isMobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.isMobile,
      reducedMotion: "no-preference",
    });
    await context.addInitScript(() => {
      sessionStorage.setItem("lusion_booted_v1", "1");
      window.__enableAboutProbe = true;
      window.__enableCtaProbe = true;
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));

    // Home Featured Work must match the live ten-item route selection.
    let response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.ok(response?.ok(), "Home route responds successfully");
    await page.locator("#home-featured").waitFor({ state: "attached" });
    const featured = await page.locator("#home-featured").evaluate(section => {
      return [...section.querySelectorAll(".project-list .project-item")].map(card => card.getAttribute("href"));
    });
    assert.deepEqual(featured, expectedFeatured, "Home Featured Work uses the current live project sequence");
    await page.screenshot({ path: path.join(out, `home-featured-${viewport.name}.jpg`), type: "jpeg", quality: 65, fullPage: false, timeout: 120000 });

    // Projects archive must expose exactly the current 17 detail routes in order.
    response = await page.goto(base + "/projects", { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.ok(response?.ok(), "Projects archive responds successfully");
    await page.locator("#projects-list").waitFor({ state: "attached" });
    const archiveState = await page.locator("#projects").evaluate(main => ({
      count: main.querySelector("#projects-count")?.textContent?.trim(),
      links: [...main.querySelectorAll("#projects-list a")].map(anchor => new URL(anchor.href).pathname),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    assert.equal(archiveState.count, "17", "archive count displays the live total");
    assert.deepEqual(archiveState.links, expectedArchive, "archive cards match the live order and routes");
    assert.equal(archiveState.overflow, false, "archive has no horizontal page overflow");
    await page.screenshot({ path: path.join(out, `projects-archive-${viewport.name}.jpg`), type: "jpeg", quality: 65, fullPage: false, timeout: 120000 });

    const routeResults = [];
    for (const project of details) {
      errors.length = 0;
      response = await page.goto(base + project.route, { waitUntil: "domcontentloaded", timeout: 60000 });
      assert.ok(response?.ok(), `Project route responds: ${project.route}`);
      const main = page.locator(`main#project-${project.id}`);
      await main.waitFor({ state: "attached" });
      await page.waitForTimeout(90);

      const state = await main.evaluate((element, expectedLaunchLabel) => {
        const heading = element.querySelector("h1");
        const next = element.querySelector("#project-next a");
        const launchLabel = expectedLaunchLabel;
        const launch = [...element.querySelectorAll("a,button,[data-launch-unavailable]")]
          .find(node => node.textContent?.trim().toLowerCase().includes(launchLabel.toLowerCase()));
        const firstStage = element.querySelector(":scope > section");
        const stickyColumn = firstStage?.querySelector(":scope > div:first-child");
        const media = [...element.querySelectorAll("figure, video, div[role='button'] > img")];
        const emptyLinks = [...element.querySelectorAll("a")].filter(anchor => !anchor.getAttribute("href")?.trim());
        return {
          title: heading?.textContent?.trim() || "",
          nextHref: next?.getAttribute("href") || "",
          nextTitle: next?.textContent?.trim() || "",
          mediaCount: media.length,
          mediaSources: media.map(node => node.getAttribute("src") || node.querySelector("img")?.getAttribute("src") || ""),
          stickyPosition: stickyColumn ? getComputedStyle(stickyColumn).position : "missing",
          launchFound: !!launch,
          launchUnavailable: launch?.getAttribute("data-launch-unavailable") === "true",
          emptyLinks: emptyLinks.length,
          hasNext: !!element.querySelector("#project-next"),
          hasEndSection: !!element.querySelector("#end-section"),
          hasFooter: !!element.querySelector("#footer-section"),
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      }, project.launchCta?.label || "Launch Project");

      assert.ok(state.title, `project heading is present: ${project.id}`);
      assert.equal(state.nextHref, project.nextProject.href, `next-project chain matches live order: ${project.id}`);
      assert.ok(state.nextTitle, `next-project label is readable: ${project.id}`);
      assert.equal(state.mediaCount, project.media.length, `all media slots render: ${project.id}`);
      assert.ok(state.mediaSources.every(Boolean), `every media slot has a source: ${project.id}`);
      assert.ok(state.launchFound, `launch action label is present: ${project.id}`);
      assert.equal(state.emptyLinks, 0, `no empty/self links: ${project.id}`);
      assert.ok(state.hasNext && state.hasEndSection && state.hasFooter, `next, CTA and footer sections exist: ${project.id}`);
      assert.equal(state.overflow, false, `no horizontal overflow: ${project.id}`);
      assert.equal(state.stickyPosition, viewport.isMobile ? "static" : "sticky", `editorial column responds at ${viewport.name}: ${project.id}`);
      if (!project.launchCta?.href?.trim() && !project.launchCta?.isVimeoOverlay) {
        assert.equal(state.launchUnavailable, true, `missing launch destination stays non-navigating: ${project.id}`);
      } else {
        assert.equal(state.launchUnavailable, false, `valid launch action remains interactive: ${project.id}`);
      }
      assert.deepEqual(errors, [], `no uncaught browser errors: ${project.id}`);

      if (["oryzo_ai", "of_the_oak", "porsche_dream_machine", "maxmara_bearings_gifts"].includes(project.id)) {
        await page.screenshot({
          path: path.join(out, `${project.id}-${viewport.name}.jpg`),
          type: "jpeg", quality: 65, fullPage: false, timeout: 120000,
        });
      }
      routeResults.push({ id: project.id, title: state.title, next: state.nextHref, media: state.mediaCount, launchUnavailable: state.launchUnavailable });
    }
    report.viewports.push({ ...viewport, featuredCount: featured.length, archiveCount: archiveState.links.length, projects: routeResults });
    await context.close();
  }
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  console.log(`PASS Projects experience: 10 Home features, 17 archive entries, 17 detail routes x 2 viewports, media slots, next-project chain, CTA links, sticky layout and overflow checks.`);
} finally {
  await browser.close();
}
