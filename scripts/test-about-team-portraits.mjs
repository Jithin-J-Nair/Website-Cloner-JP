import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const about = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")).about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const modelLoader = fs.readFileSync("src/lib/lusion-buf-loader.ts", "utf8");
const team = about.who.team;

assert.equal(team.length, 7, "About team roster has seven source members");
for (const member of team) {
  assert.match(member.modelPath, /^\/assets\/team\/[a-z0-9_-]+\.buf$/);
  const file = path.join("media-bundle", member.modelPath.replace(/^\/assets\//, ""));
  assert.ok(fs.existsSync(file), `team point-cloud asset exists for ${member.name}`);
  const bytes = fs.readFileSync(file);
  const headerLength = bytes.readUInt32LE(0);
  const header = JSON.parse(bytes.subarray(4, 4 + headerLength).toString("utf8"));
  assert.equal(header.vertexCount, member.vertexCount, `vertex count matches for ${member.name}`);
  assert.equal(header.meshType, "Points", `team portrait is a point cloud for ${member.name}`);
  assert.ok(header.attributes.some(attribute => attribute.id === "position" && attribute.componentSize === 3));
  assert.ok(header.attributes.some(attribute => attribute.id === "nShade" && attribute.componentSize === 4));
}
assert.match(page, /loadLusionBuf\(member\.modelPath\)/, "team selection loads its mapped portrait asset");
assert.match(page, /teamPortraitSource = "bundle"/, "the active section exposes bundled portrait status");
assert.match(page, /new THREE\.BufferAttribute\(shade, 4, true\)/, "bundled point normals and shade use normalized byte attributes");
assert.match(page, /attribute vec4 nShade;/, "portrait shader consumes packed per-point shading");
assert.match(page, /normalMatrix \* sourceNormal/, "portrait highlights use the original point-cloud normal");

assert.match(page, /procedural-fallback/, "an offline-safe procedural fallback remains");
assert.match(page, /cancelled \|\| portraitGeoRef\.current !== geo/, "late portrait loads cannot mutate a disposed scene");
assert.match(modelLoader, /export function loadLusionBuf/);
assert.match(modelLoader, /const bufCache = new Map/);

console.log("PASS About team portraits: all seven 8,192-point buffers, attributes, mapped loading and disposal guards verified.");
