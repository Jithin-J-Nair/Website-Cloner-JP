#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { launchMotionBrowser } from "./lib/browser-runtime.mjs";

const base = process.env.ABOUT_A11Y_BASE || "http://127.0.0.1:3000";
const out = process.env.ABOUT_A11Y_OUT || "temp/about-accessibility";
fs.mkdirSync(out, { recursive: true });
const cases = [
  { width: 1440, height: 900, reducedMotion: "no-preference" },
  { width: 390, height: 844, reducedMotion: "no-preference" },
  { width: 1440, height: 900, reducedMotion: "reduce" },
  { width: 390, height: 844, reducedMotion: "reduce" },
];
const browser = await launchMotionBrowser();
try {
  for (const item of cases) {
    const width = item.width;
    const height = item.height;
    const reducedMotion = item.reducedMotion;
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion,
    });
    await context.addInitScript(() => {
      try { sessionStorage.setItem("lusion_booted_v1", "1"); } catch {}
      window.__enableAboutProbe = true;
      window.__enableCtaProbe = true;
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const report = { viewport: { width, height }, reducedMotion, errors, keyboard: [], checks: [] };
    const reportPath = out + "/" + width + "-" + reducedMotion + ".json";
    try {
      const response = await page.goto(base + "/about", { waitUntil: "networkidle", timeout: 120000 });
      assert.ok(response && response.ok(), "About responds successfully");
      await page.waitForFunction(() => window.__aboutProbe && window.__aboutProbe().state === "ready", null, { timeout: 90000 });

      const logo = page.locator("#header-logo");
      assert.equal((await logo.innerText()).trim(), "JITHIN", "About header preserves the merged site branding");
      assert.equal(await logo.getAttribute("aria-label"), "JITHIN Home", "About home link has a matching accessible brand name");
      assert.equal(await logo.locator("svg").count(), 0, "About does not render the captured SVG wordmark");
      const logoWeight = await logo.locator("span").evaluate(el => getComputedStyle(el).fontWeight);
      assert.equal(logoWeight, "400", "About wordmark is regular weight");
      assert.equal(await page.locator("main#about").count(), 1);
      assert.equal(await page.locator("#about-recognition-window[role=region][tabindex='0']").count(), 1,
        "recognition scroller is a named keyboard region");
      assert.equal(await page.getByRole("link", { name: "Let's work together!" }).count(), 1,
        "CTA has a meaningful accessible name");
      assert.equal(await page.getByRole("button", { name: /Next page:/i }).count(), 1,
        "Next Page portal exposes a button name");

      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press("Tab");
        const focus = await page.evaluate(() => {
          const el = document.activeElement;
          if (!(el instanceof HTMLElement) || el === document.body) return null;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            id: el.id,
            label: el.getAttribute("aria-label") || (el.textContent || "").trim().slice(0, 48),
            visible: style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0,
            inAriaHiddenTree: !!el.closest('[aria-hidden="true"]'),
          };
        });
        if (!focus) break;
        assert.ok(focus.visible, "Tab focus never lands on an invisible element");
        assert.equal(focus.inAriaHiddenTree, false, "Tab focus never enters decorative aria-hidden content");
        report.keyboard.push(focus);
      }
      assert.ok(report.keyboard.length >= 8, "header/navigation and page actions remain keyboard reachable");

      const recognition = page.locator("#about-recognition-window");
      await recognition.scrollIntoViewIfNeeded();
      await recognition.focus();
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await page.keyboard.press("PageDown");
      await page.waitForFunction(before => window.scrollY > before, scrollBefore, { timeout: 5000 });
      const scrollAfter = await page.evaluate(() => window.scrollY);
      assert.ok(scrollAfter > scrollBefore, "PageDown follows the full-flow recognition content through document scrolling");
      const recognitionFlow = await recognition.evaluate(element => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        overflowY: getComputedStyle(element).overflowY,
        awards: element.querySelectorAll(".about-source-award-group").length,
        articles: element.querySelectorAll(".about-source-articles a[href]").length,
        talks: element.querySelectorAll(".about-source-talks li").length,
      }));
      assert.ok(recognitionFlow.scrollHeight <= recognitionFlow.clientHeight + 1, "recognition is not nested in a clipped scroll window");
      assert.equal(recognitionFlow.overflowY, "visible");
      assert.deepEqual(
        { awards: recognitionFlow.awards, articles: recognitionFlow.articles, talks: recognitionFlow.talks },
        { awards: 7, articles: 3, talks: 5 },
        "all recognition content remains present and keyboard-reachable in normal page flow"
      );
      report.checks.push("full-flow recognition remains keyboard reachable without nested clipping");

      // The scene timeline is normalized from #about, not the nested #about-who
      // sticky stage. Use the same section origin as AboutPageView.renderAtScroll.
      const about = page.locator("#about");
      const unit = width === 390 ? height : width;
      const aboutTop = await about.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
      await page.evaluate(({ top, delta }) => window.scrollTo({ top: top + delta, behavior: "instant" }),
        { top: aboutTop, delta: unit * 7.1 });
      await page.waitForFunction(() => {
        const probe = window.__aboutProbe?.();
        return probe && probe.u > 7.05 &&
          document.querySelector(".about-who-team-overlay")?.dataset.teamActive === "true";
      }, null, { timeout: 20000 });
      const selectors = page.locator(".about-who-team-overlay button[aria-label^='Select ']");
      assert.equal(await selectors.count(), 7, "seven individual team selectors remain exposed");
      const selector = selectors.nth(1);
      const selectorBox = await selector.boundingBox();
      assert.ok(selectorBox && selectorBox.width >= 24 && selectorBox.height >= 24);
      await selector.press("Enter");
      await page.waitForFunction(() =>
        document.querySelectorAll(".about-who-team-overlay button[aria-label^='Select ']")[1]
          ?.getAttribute("aria-pressed") === "true",
        null,
        { timeout: 3000 }
      );
      assert.equal(await selector.getAttribute("aria-pressed"), "true", "Enter activates the focused team selector");
      report.checks.push("team selectors have 24px minimum targets and work with Enter");

      if (reducedMotion === "reduce") {
        const reduced = await page.evaluate(() => {
          const ring = document.querySelector(".about-wide-chromatic-ring");
          const letter = document.querySelector("#end-section .about-cta-letter");
          const region = document.querySelector("#about-recognition-window");
          return {
            scene: window.__aboutProbe && window.__aboutProbe(),
            teamReduced: document.querySelector(".about-who-team-overlay")?.getAttribute("data-reduced"),
            expertiseReduced: document.querySelector("#about-capability")?.getAttribute("data-reduced"),
            ringDisplay: ring ? getComputedStyle(ring).display : "missing",
            titleAnimation: letter ? getComputedStyle(letter).animationName : "missing",
            regionOverflow: region ? region.scrollHeight > region.clientHeight + 1 : false,
            awardGroups: region?.querySelectorAll(".about-source-award-group").length ?? 0,
            articles: region?.querySelectorAll(".about-source-articles a[href]").length ?? 0,
            talks: region?.querySelectorAll(".about-source-talks li").length ?? 0,
          };
        });
        assert.ok(reduced.scene && reduced.scene.reducedMotion === true, "scene runtime observes reduced motion");
        assert.equal(reduced.scene.portraitPoints, 8192, "reduced motion uses the 8K portrait tier");
        assert.equal(reduced.teamReduced, "true");
        assert.equal(reduced.expertiseReduced, "true");
        assert.equal(reduced.ringDisplay, "none");
        assert.equal(reduced.titleAnimation, "none");
        assert.equal(reduced.regionOverflow, false, "recognition content is not trapped in a nested scroll viewport");
        assert.deepEqual(
          { awards: reduced.awardGroups, articles: reduced.articles, talks: reduced.talks },
          { awards: 7, articles: 3, talks: 5 },
          "reduced-motion users retain the complete full-flow recognition content"
        );
        report.checks.push("reduced-motion mode: static team/CTA, 8K portrait, no chromatic ring, full-flow recognition content");
      } else {
        const normal = await page.evaluate(() => window.__aboutProbe && window.__aboutProbe());
        assert.ok(normal && [8192, 16384, 24576].includes(normal.portraitPoints));
        report.checks.push("normal-motion portrait selects a declared quality tier");
      }

      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        "page has no horizontal overflow");
      assert.deepEqual(errors, [], "no browser runtime errors");
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log("PASS About accessibility " + width + "x" + height + " motion=" + reducedMotion +
        ": " + report.keyboard.length + " keyboard stops; " + report.checks.join("; "));
    } finally {
      report.errors = errors;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      await context.close();
    }
  }
} finally {
  await browser.close();
}
