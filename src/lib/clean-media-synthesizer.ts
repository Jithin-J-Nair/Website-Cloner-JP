/**
 * Clean-Room Deterministic SVG Art Synthesizer (`D1` Production Asset Pipeline)
 *
 * When unredistributable proprietary reference media files (`.webp`, `.jpg`) are
 * absent in a clean production environment, this module deterministically renders
 * crisp, high-contrast vector studio art plates using ONLY verified metadata from
 * `src/data/reference/lusion-ground-truth.json` (project title, brand palette
 * `colorBg` / `colorText` / `colorHighlight`, aspect ratio, categories, and media
 * slot index). Zero third-party binary bytes or trademarks are embedded.
 */

import {
  LUSION_PROJECTS_ARCHIVE,
  LUSION_PROJECT_DETAILS,
  type LusionProjectDetail,
} from "@/data/reference";

export interface SynthesizedMediaResult {
  svg: string;
  width: number;
  height: number;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededFloat(seed: number, step: number): number {
  let x = (seed + Math.imul(step + 1, 2654435761)) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

const CANONICAL_DISPLAY_TITLES: Record<string, string> = {
  porsche_dream_machine: "Porsche: Dream Machine",
  spaace: "Spaace - NFT Marketplace",
};

export function getCanonicalProjectTitle(id: string, fallbackTitle: string): string {
  return CANONICAL_DISPLAY_TITLES[id] ?? fallbackTitle;
}

/**
 * Set of every canonical asset relative path referenced across all 22 Lusion routes.
 */
const APPROVED_SYNTHETIC_PATHS: Map<
  string,
  { project?: LusionProjectDetail; width: number; height: number; slotLabel: string; kind: "card" | "detail" | "landscape" | "og" }
> = (() => {
  const map = new Map<
    string,
    { project?: LusionProjectDetail; width: number; height: number; slotLabel: string; kind: "card" | "detail" | "landscape" | "og" }
  >();

  const detailById = new Map<string, LusionProjectDetail>();
  for (const pd of LUSION_PROJECT_DETAILS) {
    detailById.set(pd.id, pd);
  }

  for (const card of LUSION_PROJECTS_ARCHIVE.projects) {
    const pd = detailById.get(card.id);
    const thumbRel = card.thumbnail.replace(/^\/assets\//, "");
    map.set(thumbRel, {
      project: pd,
      width: card.thumbnailWidth || 1200,
      height: card.thumbnailHeight || 900,
      slotLabel: "FEATURED PLATE",
      kind: "card",
    });
    if (card.depthMap) {
      map.set(card.depthMap.replace(/^\/assets\//, ""), {
        project: pd,
        width: card.depthMapWidth || 1200,
        height: card.depthMapHeight || 900,
        slotLabel: "DEPTH FIELD",
        kind: "card",
      });
    }
  }

  for (const pd of LUSION_PROJECT_DETAILS) {
    for (const item of pd.media) {
      const w = item.declaredWidth || 1280;
      const h = item.declaredHeight || 720;
      const label = `SEQUENCE ${String(item.index + 1).padStart(2, "0")} // ${item.type.toUpperCase()}`;
      if (item.desktopSrc) {
        map.set(item.desktopSrc.replace(/^\/assets\//, ""), {
          project: pd,
          width: w,
          height: h,
          slotLabel: label,
          kind: "detail",
        });
      }
      if (item.mobileSrc) {
        map.set(item.mobileSrc.replace(/^\/assets\//, ""), {
          project: pd,
          width: item.hasDedicatedMobileVariant ? Math.round(h * 0.72) : w,
          height: h,
          slotLabel: `${label} (MOBILE)`,
          kind: "detail",
        });
      }
    }
  }

  map.set("textures/tunnels/earth_landscape.jpg", {
    width: 1600,
    height: 1000,
    slotLabel: "ATMOSPHERIC HORIZON",
    kind: "landscape",
  });

  map.set("meta/social_sharing.jpg", {
    width: 1200,
    height: 630,
    slotLabel: "LUSION CREATIVE STUDIO",
    kind: "og",
  });

  return map;
})();

export function isApprovedCatalogAsset(relPath: string): boolean {
  if (APPROVED_SYNTHETIC_PATHS.has(relPath)) return true;
  const staticApproved = new Set([
    "textures/reel/desktop.mp4",
    "textures/reel/mobile.mp4",
    "textures/LDR_RGB1_0.png",
    "textures/smaa-area.png",
    "textures/smaa-search.png",
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
  return staticApproved.has(relPath);
}

export function synthesizeCleanAssetSvg(relPath: string): SynthesizedMediaResult | null {
  const entry = APPROVED_SYNTHETIC_PATHS.get(relPath);
  if (!entry) return null;
  // Never synthesize fake SVG payloads for `.mp4` streams; video slots use `<ProceduralReelStream />`
  if (/\.(mp4|webm|ogg|mp3)$/i.test(relPath)) return null;

  const { width, height, project, slotLabel, kind } = entry;
  const seed = hashSeed(relPath);

  if (kind === "landscape") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dfe8ff"/>
          <stop offset="52%" stop-color="#f6f8ff"/>
          <stop offset="100%" stop-color="#c9d8ff"/>
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="44%" r="48%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96"/>
          <stop offset="55%" stop-color="#8fb0ff" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#1a2ffb" stop-opacity="0.06"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#sky)"/>
      <rect width="${width}" height="${height}" fill="url(#sun)"/>
      <ellipse cx="${width * 0.5}" cy="${height * 1.16}" rx="${width * 0.78}" ry="${height * 0.52}" fill="#e9efff" opacity="0.88"/>
      <ellipse cx="${width * 0.5}" cy="${height * 1.2}" rx="${width * 0.74}" ry="${height * 0.48}" fill="none" stroke="#1a2ffb" stroke-opacity="0.22" stroke-width="3"/>
    </svg>`;
    return { svg, width, height };
  }

  const bg = project?.theme.colorBg ?? "#12151f";
  const fg = project?.theme.colorText ?? "#f0f1fa";
  const accent = project?.theme.colorHighlight || "#1a2ffb";
  const rawTitle = project ? getCanonicalProjectTitle(project.id, project.title) : "LUSION";
  const title = escapeXml(rawTitle);
  const categories = escapeXml(
    (project?.categories?.slice(0, 4).join(" · ") || "3D · WEBGL · DESIGN").toUpperCase()
  );

  const cx1 = Math.round(width * (0.24 + seededFloat(seed, 1) * 0.52));
  const cy1 = Math.round(height * (0.22 + seededFloat(seed, 2) * 0.44));
  const r1 = Math.round(Math.min(width, height) * (0.34 + seededFloat(seed, 3) * 0.24));
  const cx2 = Math.round(width * (0.18 + seededFloat(seed, 4) * 0.64));
  const cy2 = Math.round(height * (0.35 + seededFloat(seed, 5) * 0.45));
  const ringCount = 5;

  const rings: string[] = [];
  for (let i = 0; i < ringCount; i += 1) {
    const rr = Math.round(r1 * (0.32 + i * 0.22));
    const rot = Math.round(seededFloat(seed, 10 + i) * 180);
    rings.push(
      `<ellipse cx="${cx1}" cy="${cy1}" rx="${rr}" ry="${Math.round(rr * 0.62)}" transform="rotate(${rot} ${cx1} ${cy1})" fill="none" stroke="${fg}" stroke-opacity="${(0.22 - i * 0.032).toFixed(3)}" stroke-width="2"/>`
    );
  }

  const titleFontSize = Math.round(Math.min(width * 0.068, height * 0.098));
  const metaFontSize = Math.max(13, Math.round(Math.min(width, height) * 0.021));
  const padX = Math.round(width * 0.062);
  const padY = Math.round(height * 0.095);
  const isCardPlate = entry.kind === "card";

  const captionLayer = isCardPlate
    ? `<rect x="${Math.round(cx1 - r1 * 0.42)}" y="${Math.round(cy1 - r1 * 0.42)}" width="${Math.round(r1 * 0.84)}" height="${Math.round(r1 * 0.84)}" rx="28" fill="${fg}" fill-opacity="0.06" stroke="${fg}" stroke-opacity="0.22" stroke-width="1.5" transform="rotate(${Math.round(seededFloat(seed, 9) * 32 - 16)} ${cx1} ${cy1})"/>`
    : `<line x1="${padX}" y1="${padY + metaFontSize + 14}" x2="${width - padX}" y2="${padY + metaFontSize + 14}" stroke="${fg}" stroke-opacity="0.14" stroke-width="1"/>
    <text x="${padX}" y="${padY}" fill="${fg}" fill-opacity="0.68" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="2.2">${escapeXml(slotLabel)}</text>
    <text x="${width - padX}" y="${padY}" text-anchor="end" fill="${accent}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="1.6">LUSION ARCHIVE</text>
    <text x="${padX}" y="${height - padY - metaFontSize * 1.9}" fill="${fg}" font-family="system-ui, -apple-system, Helvetica Neue, Arial, sans-serif" font-size="${titleFontSize}" font-weight="500" letter-spacing="-1.2">${title}</text>
    <text x="${padX}" y="${height - padY}" fill="${fg}" fill-opacity="0.66" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="1.8">${categories}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>${title}</title>
    <defs>
      <radialGradient id="glowA" cx="${((cx1 / width) * 100).toFixed(1)}%" cy="${((cy1 / height) * 100).toFixed(1)}%" r="62%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.58"/>
        <stop offset="55%" stop-color="${accent}" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="${((cx2 / width) * 100).toFixed(1)}%" cy="${((cy2 / height) * 100).toFixed(1)}%" r="48%">
        <stop offset="0%" stop-color="${fg}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fg}" stop-opacity="0.12"/>
        <stop offset="50%" stop-color="${fg}" stop-opacity="0.02"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.34"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <rect width="${width}" height="${height}" fill="url(#glowA)"/>
    <rect width="${width}" height="${height}" fill="url(#glowB)"/>
    <rect width="${width}" height="${height}" fill="url(#sheen)"/>
    ${rings.join("\n    ")}
    <circle cx="${cx1}" cy="${cy1}" r="${Math.round(r1 * 0.24)}" fill="${accent}" fill-opacity="0.34" stroke="${fg}" stroke-opacity="0.45" stroke-width="2"/>
    <circle cx="${Math.round(cx1 - r1 * 0.07)}" cy="${Math.round(cy1 - r1 * 0.07)}" r="${Math.round(r1 * 0.05)}" fill="#ffffff" fill-opacity="0.72"/>
    ${captionLayer}
  </svg>`;

  return { svg, width, height };
}
