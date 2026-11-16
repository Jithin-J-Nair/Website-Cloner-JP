#!/usr/bin/env node
import assert from "node:assert/strict";

const base = process.env.BRANDING_BASE || "http://127.0.0.1:3000";

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]])
  );
}

for (const route of ["/", "/about", "/projects"]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, `${route} responds successfully`);
  const html = await response.text();
  const logo = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .find((match) => attributes(match[1]).id === "header-logo");
  assert.ok(logo, `${route} retains the navigation home link`);
  assert.equal(attributes(logo[1])["aria-label"], "JITHIN Home");
  assert.equal(attributes(logo[1]).href, "/");
  assert.equal(logo[2].replace(/<[^>]*>/g, "").trim(), "JITHIN");

  if (route === "/") {
    const tags = (html.match(/<(?:meta|link)\b[^>]*>/g) || []).map(attributes);
    const meta = (key, value) => tags.find((tag) => tag[key] === value);
    assert.match(html, /<title>JITHIN<\/title>/);
    assert.equal(new URL(meta("rel", "canonical")?.href).href, "https://jithinrp.com/");
    assert.equal(meta("property", "og:title")?.content, "JITHIN");
    assert.equal(meta("property", "og:site_name")?.content, "JITHIN");
    assert.equal(meta("name", "twitter:title")?.content, "JITHIN");
    assert.equal(meta("name", "twitter:site")?.content, "@jithin");
    for (const [key, name] of [["name", "description"], ["property", "og:description"], ["name", "twitter:description"]]) {
      assert.equal(meta(key, name)?.content, "3D visual storytelling and interactive web experiences by Jithin.");
    }
    assert.match(html, /©2026 JITHIN/);
    assert.match(html, /Built by <!-- -->JITHIN<!-- --> with/);
  }
  console.log(`PASS merged branding: ${route}`);
}
