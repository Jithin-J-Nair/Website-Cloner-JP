#!/usr/bin/env node
import assert from "node:assert/strict";
import { launchMotionBrowser } from "./lib/browser-runtime.mjs";

const base = process.env.NAVIGATION_A11Y_BASE || "http://127.0.0.1:3000";
const browser = await launchMotionBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => sessionStorage.setItem("lusion_booted_v1", "1"));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await trigger.click();
  const menu = page.getByRole("navigation", { name: "Primary Navigation" });
  await menu.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const node = document.querySelector("#header-menu");
    return node?.getAttribute("aria-hidden") === "false" &&
      node.contains(document.activeElement);
  });

  const controls = await menu.locator('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])').evaluateAll((nodes) =>
    nodes.filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true")
      .map((node) => node.id || node.getAttribute("aria-label") || node.textContent?.trim() || node.tagName)
  );
  assert.ok(controls.length >= 4, "open menu exposes its visible links, newsletter and contact controls");

  await page.keyboard.press("Shift+Tab");
  await page.waitForFunction(() => {
    const menu = document.querySelector("#header-menu");
    const visible = [...menu.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true");
    return document.activeElement === visible[visible.length - 1];
  });

  await page.keyboard.press("Tab");
  await page.waitForFunction(() => {
    const menu = document.querySelector("#header-menu");
    const visible = [...menu.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true");
    return document.activeElement === visible[0];
  });

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => {
    const trigger = document.querySelector("#header-right-menu-btn");
    return trigger?.getAttribute("aria-expanded") === "false" && document.activeElement === trigger;
  });

  await trigger.click();
  await menu.getByRole("button", { name: "Contact" }).click();
  await page.waitForFunction(() => {
    const target = document.querySelector("#end-section");
    const nav = document.querySelector("#header-menu");
    const rect = target?.getBoundingClientRect();
    return nav?.getAttribute("aria-hidden") === "true" &&
      !!rect && rect.top < window.innerHeight && rect.bottom > 0;
  }, null, { timeout: 30000 });
  assert.deepEqual(errors, []);
  console.log("PASS navigation keyboard lifecycle: focus entry, Tab wrap, Shift+Tab wrap, Escape restoration and Contact-to-end-section scrolling.");
} finally {
  await context.close();
  await browser.close();
}
