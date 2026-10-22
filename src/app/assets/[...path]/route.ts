import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  isApprovedCatalogAsset,
  synthesizeCleanAssetSvg,
} from "@/lib/clean-media-synthesizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ASSETS_ROOT = path.resolve(process.cwd(), "public", "assets");

const SAFE_MIME_BY_EXT: Readonly<Record<string, string>> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const OPEN_LICENSE_FONTS_ALLOWLIST = new Set([
  "fonts/IBMPlexMono-Medium.woff",
  "fonts/IBMPlexMono-Medium.woff2",
  "fonts/IBMPlexMono-Regular.woff",
  "fonts/IBMPlexMono-Regular.woff2",
  "fonts/InstrumentSans-Variable.woff2",
  "fonts/InstrumentSans-VariableItalic.woff2",
  "fonts/capability-icons/creative.svg",
  "fonts/capability-icons/production.svg",
  "fonts/capability-icons/strategy.svg",
  "fonts/capability-icons/tech.svg",
]);

const BASE_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const SVG_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  ...BASE_SECURITY_HEADERS,
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
};

function buildHeaders(mime: string, extra: Record<string, string> = {}): Record<string, string> {
  const isSvg = mime.startsWith("image/svg+xml");
  return {
    ...(isSvg ? SVG_SECURITY_HEADERS : BASE_SECURITY_HEADERS),
    "Content-Type": mime,
    ...extra,
  };
}

type PathValidationResult =
  | { ok: true; relPath: string; ext: string; mime: string }
  | { ok: false; status: 400 | 403 | 404; message: string };

/**
 * Validates raw request URL & path segments before touching the filesystem:
 *  - Rejects null bytes, control chars, backslashes, `..` traversal (both raw and encoded),
 *    dot-prefixed hidden files, empty segments, and excessive nesting.
 *  - Blocks commercial/unlisted fonts in ANY folder or case (`fonts/...`, `.woff2`, `.ttf`, `.otf`, `.eot`),
 *    allowing strictly the documented SIL OFL / MIT files under `public/assets/fonts/`.
 *  - Restricts extensions and paths strictly to the approved manifest allowlist.
 */
function validateAssetRequest(rawUrl: string, segments: string[]): PathValidationResult {
  const rawPathname = rawUrl.split("?")[0] || "";
  let decodedPathname = "";
  try {
    decodedPathname = decodeURIComponent(rawPathname);
  } catch {
    return { ok: false, status: 400, message: "Malformed URL encoding" };
  }

  if (
    /[\x00-\x1f\x7f\\]/.test(rawPathname) ||
    /[\x00-\x1f\x7f\\]/.test(decodedPathname) ||
    /(?:^|\/)\.\.(?:\/|$)/.test(rawPathname) ||
    /(?:^|\/)\.\.(?:\/|$)/.test(decodedPathname)
  ) {
    return { ok: false, status: 400, message: "Invalid asset path" };
  }

  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 8) {
    return { ok: false, status: 400, message: "Invalid asset path depth" };
  }

  for (const seg of segments) {
    if (
      !seg ||
      seg.length > 120 ||
      seg === "." ||
      seg === ".." ||
      seg.startsWith(".") ||
      seg.includes("/") ||
      seg.includes("\\") ||
      /[\x00-\x1f\x7f]/.test(seg)
    ) {
      return { ok: false, status: 400, message: "Invalid path segment" };
    }
  }

  const relPath = segments.join("/");
  const ext = path.extname(relPath).toLowerCase();

  const touchesFontNamespace =
    segments.some((s) => s.toLowerCase() === "fonts") || /\.(woff2?|ttf|otf|eot)$/i.test(ext);

  if (touchesFontNamespace && !OPEN_LICENSE_FONTS_ALLOWLIST.has(relPath)) {
    return {
      ok: false,
      status: 403,
      message: "Commercial font redistribution disabled under Font Option 2",
    };
  }

  const mime = SAFE_MIME_BY_EXT[ext];
  if (!mime) {
    return { ok: false, status: 403, message: "Unsupported or disallowed asset type" };
  }

  if (!isApprovedCatalogAsset(relPath)) {
    return { ok: false, status: 404, message: "Asset not in approved manifest" };
  }

  return { ok: true, relPath, ext, mime };
}

/**
 * Safely resolves a regular file inside `baseDir` with full symlink canonicalization
 * (`fsp.realpath`) so symlinks pointing outside `baseDir` are always rejected.
 */
async function resolveSafeFileInRoot(
  baseDir: string,
  relPath: string
): Promise<{ status: "found"; realFile: string; size: number } | { status: "escape" } | { status: "missing" }> {
  let realRoot: string;
  try {
    realRoot = await fsp.realpath(baseDir);
  } catch {
    return { status: "missing" };
  }

  const candidate = path.resolve(realRoot, relPath);
  if (candidate !== realRoot && !candidate.startsWith(realRoot + path.sep)) {
    return { status: "escape" };
  }

  let lstat: fs.Stats;
  try {
    lstat = await fsp.lstat(candidate);
  } catch {
    return { status: "missing" };
  }

  let realTarget: string;
  try {
    realTarget = await fsp.realpath(candidate);
  } catch {
    return { status: "missing" };
  }

  if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) {
    return { status: "escape" };
  }

  const stat = lstat.isSymbolicLink() ? await fsp.stat(realTarget) : lstat;
  if (!stat.isFile()) {
    return { status: "missing" };
  }

  return { status: "found", realFile: realTarget, size: stat.size };
}

function createNodeFileStream(filePath: string, opts?: { start: number; end: number }): ReadableStream<Uint8Array> {
  let nodeStream: fs.ReadStream | null = null;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream = fs.createReadStream(filePath, opts);
      nodeStream.on("data", (chunk: Buffer | string) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf));
      });
      nodeStream.on("end", () => {
        controller.close();
      });
      nodeStream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      if (nodeStream) {
        nodeStream.destroy();
        nodeStream = null;
      }
    },
  });
}

/**
 * Strict single-range RFC 7233 byte-range parser (`bytes=start-end`, `bytes=start-`, `bytes=-suffix`).
 * Returns `{ start, end }` on satisfiable ranges or `null` when `416 Range Not Satisfiable` must be sent.
 */
function parseByteRange(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  if (totalSize <= 0) return null;
  const trimmed = rangeHeader.trim();
  const match = /^bytes=(\d*)-(\d*)$/.exec(trimmed);
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  // Suffix byte-range-spec (`bytes=-N` -> last N bytes)
  if (rawStart === "") {
    const suffixLength = Number(rawEnd);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(0, totalSize - suffixLength);
    return { start, end: totalSize - 1 };
  }

  const start = Number(rawStart);
  if (!Number.isSafeInteger(start) || start < 0 || start >= totalSize) return null;

  if (rawEnd === "") {
    return { start, end: totalSize - 1 };
  }

  const requestedEnd = Number(rawEnd);
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return null;

  return { start, end: Math.min(requestedEnd, totalSize - 1) };
}

async function resolveAssetPayload(
  request: Request,
  segments: string[]
): Promise<
  | { kind: "error"; status: number; message: string }
  | { kind: "file"; realFile: string; size: number; mime: string }
  | { kind: "buffer"; buffer: Uint8Array; mime: string }
> {
  const checked = validateAssetRequest(request.url, segments);
  if (!checked.ok) {
    return { kind: "error", status: checked.status, message: checked.message };
  }

  // 1. Approved tracked open-license files under `public/assets/`
  const publicLookup = await resolveSafeFileInRoot(PUBLIC_ASSETS_ROOT, checked.relPath);
  if (publicLookup.status === "escape") {
    return { kind: "error", status: 403, message: "Symlink escape forbidden" };
  }
  if (publicLookup.status === "found") {
    return {
      kind: "file",
      realFile: publicLookup.realFile,
      size: publicLookup.size,
      mime: checked.mime,
    };
  }

  // 2. Optional opt-in local inspection directory (ONLY when explicitly enabled by operator)
  const allowLocalInspection = process.env.LUSION_ALLOW_LOCAL_INSPECTION_ASSETS === "1";
  const localInspectionDir = process.env.LUSION_LOCAL_REF_ASSETS;
  if (allowLocalInspection && localInspectionDir) {
    const localLookup = await resolveSafeFileInRoot(localInspectionDir, checked.relPath);
    if (localLookup.status === "escape") {
      return { kind: "error", status: 403, message: "Symlink escape forbidden" };
    }
    if (localLookup.status === "found") {
      return {
        kind: "file",
        realFile: localLookup.realFile,
        size: localLookup.size,
        mime: checked.mime,
      };
    }
  }

  // 3. Self-contained clean-room production SVG art synthesis (`D1`)
  const synthesized = synthesizeCleanAssetSvg(checked.relPath);
  if (synthesized) {
    const encoded = new TextEncoder().encode(synthesized.svg);
    return {
      kind: "buffer",
      buffer: encoded,
      mime: "image/svg+xml; charset=utf-8",
    };
  }

  return { kind: "error", status: 404, message: "Asset not found" };
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await context.params;
  const resolved = await resolveAssetPayload(request, segments);
  if (resolved.kind === "error") {
    return new NextResponse(null, {
      status: resolved.status,
      headers: BASE_SECURITY_HEADERS,
    });
  }

  const size = resolved.kind === "file" ? resolved.size : resolved.buffer.byteLength;
  return new NextResponse(null, {
    status: 200,
    headers: buildHeaders(resolved.mime, {
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    }),
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await context.params;
  const resolved = await resolveAssetPayload(request, segments);
  if (resolved.kind === "error") {
    return new NextResponse(resolved.message, {
      status: resolved.status,
      headers: {
        ...BASE_SECURITY_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const totalSize = resolved.kind === "file" ? resolved.size : resolved.buffer.byteLength;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader !== null) {
    const parsed = parseByteRange(rangeHeader, totalSize);
    if (!parsed) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...BASE_SECURITY_HEADERS,
          "Content-Range": `bytes */${totalSize}`,
        },
      });
    }

    const { start, end } = parsed;
    const chunkLength = end - start + 1;
    const headers = buildHeaders(resolved.mime, {
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(chunkLength),
      "Cache-Control": "public, max-age=3600",
    });

    if (resolved.kind === "buffer") {
      return new NextResponse(Buffer.from(resolved.buffer.subarray(start, end + 1)), {
        status: 206,
        headers,
      });
    }

    return new NextResponse(createNodeFileStream(resolved.realFile, { start, end }), {
      status: 206,
      headers,
    });
  }

  const headers = buildHeaders(resolved.mime, {
    "Content-Length": String(totalSize),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
  });

  if (resolved.kind === "buffer") {
    return new NextResponse(Buffer.from(resolved.buffer), {
      status: 200,
      headers,
    });
  }

  return new NextResponse(createNodeFileStream(resolved.realFile), {
    status: 200,
    headers,
  });
}
