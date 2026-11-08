import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

// The user explicitly confirmed permission to reuse these About reference assets
// on 2026-11-07. This narrow endpoint does NOT enable the global inspection flag,
// proprietary fonts, unrelated models, audio, or arbitrary filesystem paths.
// The exact-About reconstruction also uses the existing About landscape, camera,
// humanoid/idle animation and particle/rock LOD data. No global inspection mode.
const assets: Readonly<Record<string, string>> = {
  "card-back.png": "images/cards/back.png",
  "edan.buf": "team/edan.buf", "ffi.buf": "team/ffi.buf",
  "pierre.buf": "team/pierre.buf", "yannic.buf": "team/yannic.buf",
  "paul.buf": "team/paul.buf", "andrii.buf": "team/andrii.buf",
  "sunny.buf": "team/sunny.buf", "contours.buf": "models/about/terrain_lines.buf",
  ...Object.fromEntries([
    "terrain", "camera_spline", "person", "person_idle", "logo_text",
    "sphere_l", "sphere_m", "sphere_s", "sphere_xs",
    "rock_0", "rock_1", "rock_2", "rock_3",
    "rock_0_low", "rock_1_low", "rock_2_low", "rock_3_low",
    "rock_animation_0", "rock_animation_1", "rock_animation_2", "rock_animation_3",
  ].map(name => [`${name}.buf`, `models/about/${name}.buf`])),
  ...Object.fromEntries([
    "terrain_shadow_light_height.webp", "person.webp", "person_light.webp",
    "ground_person_shadow.webp", "rocks.webp", "fog.png",
  ].map(name => [name, `textures/about/${name}`])),
};
export async function GET(request: Request, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;
  const relative = Object.hasOwn(assets, asset) ? assets[asset] : undefined;
  if (!relative) return new Response("Not found", { status: 404 });
  try {
    const root = await realpath(path.join(process.cwd(), "media-bundle"));
    const file = await realpath(path.join(root, relative));
    if (!file.startsWith(root + path.sep)) return new Response("Forbidden", { status: 403 });
    const bytes = await readFile(file);
    const etag = `"${createHash("sha256").update(bytes).digest("hex")}"`;
    const headers = {
      "Content-Type": asset.endsWith(".webp") ? "image/webp" : asset.endsWith(".png") ? "image/png" : "application/octet-stream", "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin", "Cache-Control": "public, max-age=3600, must-revalidate",
      "Content-Security-Policy": "default-src 'none'; sandbox", ETag: etag,
    };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    return new Response(Uint8Array.from(bytes), { headers: { ...headers, "Content-Length": String(bytes.length) } });
  } catch {
    return new Response("About asset unavailable", { status: 404 });
  }
}
