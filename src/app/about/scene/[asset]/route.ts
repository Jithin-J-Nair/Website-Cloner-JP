import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

// The user explicitly confirmed permission to reuse these About reference assets
// on 2026-11-07. This narrow endpoint does NOT enable the global inspection flag,
// proprietary fonts, unrelated models, audio, or arbitrary filesystem paths.
const assets: Readonly<Record<string, string>> = {
  "edan.buf": "team/edan.buf", "ffi.buf": "team/ffi.buf",
  "pierre.buf": "team/pierre.buf", "yannic.buf": "team/yannic.buf",
  "paul.buf": "team/paul.buf", "andrii.buf": "team/andrii.buf",
  "sunny.buf": "team/sunny.buf", "contours.buf": "models/about/terrain_lines.buf",
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
      "Content-Type": "application/octet-stream", "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin", "Cache-Control": "public, max-age=3600, must-revalidate",
      "Content-Security-Policy": "default-src 'none'; sandbox", ETag: etag,
    };
    if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    return new Response(Uint8Array.from(bytes), { headers: { ...headers, "Content-Length": String(bytes.length) } });
  } catch {
    return new Response("About asset unavailable", { status: 404 });
  }
}
