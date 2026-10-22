/**
 * Clean-Room Deterministic SVG Art Synthesizer (`D1` Production Asset Pipeline)
 *
 * When unredistributable proprietary reference media files (`.webp`, `.jpg`) are
 * absent in a clean production environment, this module deterministically renders
 * crisp, studio-lit clean-room vector art plates using ONLY verified metadata from
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

/**
 * Clean-room bespoke vector studio compositions per canonical project ID so every
 * featured/archive card has authentic daylight/studio luminance structure and zero
 * third-party imagery.
 */
function buildBespokeCardScene(projectId: string, w: number, h: number, title: string): string | null {
  if (projectId === "oryzo_ai") {
    // Daylight industrial design studio pegboard + ceramic cup + mechanical key grid + walnut desk
    const pegs: string[] = [];
    for (let row = 0; row < 10; row += 1) {
      for (let col = 0; col < 22; col += 1) {
        const px = Math.round(w * (0.045 + col * 0.0435));
        const py = Math.round(h * (0.06 + row * 0.062));
        pegs.push(`<rect x="${px}" y="${py}" width="${Math.round(w * 0.008)}" height="${Math.round(h * 0.032)}" rx="3" fill="#2d322f" fill-opacity="0.72"/>`);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>${title}</title>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c6cbc4"/>
          <stop offset="55%" stop-color="#b2b9b2"/>
          <stop offset="100%" stop-color="#8b948c"/>
        </linearGradient>
        <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6b4c33"/>
          <stop offset="35%" stop-color="#3a2719"/>
          <stop offset="100%" stop-color="#19110b"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#wall)"/>
      ${pegs.join("")}
      <rect x="${Math.round(w * 0.72)}" y="${Math.round(h * 0.34)}" width="${Math.round(w * 0.25)}" height="${Math.round(h * 0.22)}" rx="10" fill="#293d2b" stroke="#1b261c" stroke-width="4"/>
      <rect x="${Math.round(w * 0.0)}" y="${Math.round(h * 0.68)}" width="${w}" height="${Math.round(h * 0.055)}" fill="#6aa59a"/>
      <rect x="0" y="${Math.round(h * 0.72)}" width="${w}" height="${Math.round(h * 0.28)}" fill="url(#desk)"/>
      <polygon points="${w * 0.43},${h * 0.33} ${w * 0.56},${h * 0.33} ${w * 0.54},${h * 0.69} ${w * 0.45},${h * 0.69}" fill="#dedad2"/>
      <polygon points="${w * 0.438},${h * 0.43} ${w * 0.552},${h * 0.43} ${w * 0.545},${h * 0.58} ${w * 0.445},${h * 0.58}" fill="#2b2623"/>
      <rect x="${Math.round(w * 0.422)}" y="${Math.round(h * 0.285)}" width="${Math.round(w * 0.146)}" height="${Math.round(h * 0.055)}" rx="8" fill="#181716"/>
      <ellipse cx="${Math.round(w * 0.495)}" cy="${Math.round(h * 0.70)}" rx="${Math.round(w * 0.068)}" ry="${Math.round(h * 0.024)}" fill="#8f5f3c"/>
    </svg>`;
  }

  if (projectId === "atlas_motion") {
    // Sunlit golden-apricot volumetric cumulus clouds against cerulean sky
    const puffs = [
      [0.16, 0.42, 0.20, "#f5be98"],
      [0.24, 0.68, 0.24, "#e79e78"],
      [0.48, 0.34, 0.22, "#f8cba8"],
      [0.54, 0.58, 0.26, "#eb9f79"],
      [0.68, 0.38, 0.19, "#f7c49f"],
      [0.74, 0.72, 0.25, "#df906c"],
      [0.36, 0.84, 0.24, "#d98968"],
      [0.92, 0.56, 0.16, "#f2b48d"],
    ]
      .map(
        ([cx, cy, r, col]) =>
          `<circle cx="${Math.round(w * Number(cx))}" cy="${Math.round(h * Number(cy))}" r="${Math.round(Math.min(w, h) * Number(r))}" fill="${col}" fill-opacity="0.92"/>`
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>${title}</title>
      <defs>
        <linearGradient id="skyA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8ab7d8"/>
          <stop offset="55%" stop-color="#75a7cd"/>
          <stop offset="100%" stop-color="#5d8fb9"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#skyA)"/>
      ${puffs}
      <circle cx="${Math.round(w * 0.38)}" cy="${Math.round(h * 0.53)}" r="${Math.round(h * 0.055)}" fill="none" stroke="#ffffff" stroke-width="${Math.max(6, Math.round(h * 0.018))}"/>
      <text x="${Math.round(w * 0.46)}" y="${Math.round(h * 0.565)}" fill="#ffffff" font-family="system-ui, sans-serif" font-size="${Math.round(h * 0.082)}" font-weight="600" letter-spacing="3">ATLAS</text>
    </svg>`;
  }

  if (projectId === "zeroswap") {
    // Periwinkle-violet 3D studio figures in volumetric mist
    const figs = [0.29, 0.47, 0.64]
      .map(
        (fx, idx) => `<g opacity="${idx === 1 ? "0.95" : "0.86"}">
          <circle cx="${Math.round(w * fx)}" cy="${Math.round(h * (0.20 + idx * 0.02))}" r="${Math.round(h * 0.068)}" fill="#6f82dc"/>
          <rect x="${Math.round(w * (fx - 0.058))}" y="${Math.round(h * (0.29 + idx * 0.02))}" width="${Math.round(w * 0.116)}" height="${Math.round(h * 0.38)}" rx="28" fill="#5e72d4"/>
          <rect x="${Math.round(w * (fx - 0.048))}" y="${Math.round(h * 0.66)}" width="${Math.round(w * 0.04)}" height="${Math.round(h * 0.28)}" rx="14" fill="#4f60c2"/>
          <rect x="${Math.round(w * (fx + 0.008))}" y="${Math.round(h * 0.66)}" width="${Math.round(w * 0.04)}" height="${Math.round(h * 0.28)}" rx="14" fill="#4f60c2"/>
        </g>`
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>${title}</title>
      <defs>
        <linearGradient id="peri" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#9caaf2"/>
          <stop offset="60%" stop-color="#bbc4f8"/>
          <stop offset="100%" stop-color="#ced5fc"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#peri)"/>
      ${figs}
    </svg>`;
  }

  if (projectId === "porsche_dream_machine") {
    // Dramatic dark studio visor silhouette + glowing amethyst crystal polyhedra
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>${title}</title>
      <defs>
        <radialGradient id="stageP" cx="62%" cy="48%" r="60%">
          <stop offset="0%" stop-color="#5e2a38"/>
          <stop offset="55%" stop-color="#22131d"/>
          <stop offset="100%" stop-color="#0d0910"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#stageP)"/>
      <ellipse cx="${Math.round(w * 0.62)}" cy="${Math.round(h * 0.42)}" rx="${Math.round(w * 0.14)}" ry="${Math.round(h * 0.24)}" fill="#d79c84"/>
      <rect x="${Math.round(w * 0.45)}" y="${Math.round(h * 0.24)}" width="${Math.round(w * 0.30)}" height="${Math.round(h * 0.22)}" rx="44" fill="#0d0d12"/>
      <polygon points="${w * 0.34},${h * 0.68} ${w * 0.96},${h * 0.68} ${w * 1.0},${h * 1.0} ${w * 0.24},${h * 1.0}" fill="#581b22"/>
      <polygon points="${w * 0.25},${h * 0.48} ${w * 0.31},${h * 0.56} ${w * 0.26},${h * 0.67} ${w * 0.21},${h * 0.58}" fill="#a982e8"/>
      <polygon points="${w * 0.86},${h * 0.26} ${w * 0.93},${h * 0.34} ${w * 0.88},${h * 0.46} ${w * 0.81},${h * 0.36}" fill="#b794f4"/>
    </svg>`;
  }

  return null;
}

export function synthesizeCleanAssetSvg(relPath: string): SynthesizedMediaResult | null {
  const entry = APPROVED_SYNTHETIC_PATHS.get(relPath);
  if (!entry) return null;
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

  const rawTitle = project ? getCanonicalProjectTitle(project.id, project.title) : "LUSION";
  const title = escapeXml(rawTitle);

  if (kind === "card" && project) {
    const bespoke = buildBespokeCardScene(project.id, width, height, title);
    if (bespoke) {
      return { svg: bespoke, width, height };
    }
  }

  const bg = project?.theme.colorBg ?? "#12151f";
  const fg = project?.theme.colorText ?? "#f0f1fa";
  const accent = project?.theme.colorHighlight || "#1a2ffb";
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
    ? `<rect x="${Math.round(cx1 - r1 * 0.42)}" y="${Math.round(cy1 - r1 * 0.42)}" width="${Math.round(r1 * 0.84)}" height="${Math.round(r1 * 0.84)}" rx="28" fill="${fg}" fill-opacity="0.08" stroke="${fg}" stroke-opacity="0.28" stroke-width="2" transform="rotate(${Math.round(seededFloat(seed, 9) * 32 - 16)} ${cx1} ${cy1})"/>`
    : `<line x1="${padX}" y1="${padY + metaFontSize + 14}" x2="${width - padX}" y2="${padY + metaFontSize + 14}" stroke="${fg}" stroke-opacity="0.14" stroke-width="1"/>
    <text x="${padX}" y="${padY}" fill="${fg}" fill-opacity="0.68" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="2.2">${escapeXml(slotLabel)}</text>
    <text x="${width - padX}" y="${padY}" text-anchor="end" fill="${accent}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="1.6">LUSION ARCHIVE</text>
    <text x="${padX}" y="${height - padY - metaFontSize * 1.9}" fill="${fg}" font-family="system-ui, -apple-system, Helvetica Neue, Arial, sans-serif" font-size="${titleFontSize}" font-weight="500" letter-spacing="-1.2">${title}</text>
    <text x="${padX}" y="${height - padY}" fill="${fg}" fill-opacity="0.66" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${metaFontSize}" letter-spacing="1.8">${categories}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>${title}</title>
    <defs>
      <radialGradient id="glowA" cx="${((cx1 / width) * 100).toFixed(1)}%" cy="${((cy1 / height) * 100).toFixed(1)}%" r="62%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.62"/>
        <stop offset="55%" stop-color="${accent}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowB" cx="${((cx2 / width) * 100).toFixed(1)}%" cy="${((cy2 / height) * 100).toFixed(1)}%" r="48%">
        <stop offset="0%" stop-color="${fg}" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${fg}" stop-opacity="0.14"/>
        <stop offset="50%" stop-color="${fg}" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <rect width="${width}" height="${height}" fill="url(#glowA)"/>
    <rect width="${width}" height="${height}" fill="url(#glowB)"/>
    <rect width="${width}" height="${height}" fill="url(#sheen)"/>
    ${rings.join("\n    ")}
    <circle cx="${cx1}" cy="${cy1}" r="${Math.round(r1 * 0.24)}" fill="${accent}" fill-opacity="0.36" stroke="${fg}" stroke-opacity="0.45" stroke-width="2"/>
    <circle cx="${Math.round(cx1 - r1 * 0.07)}" cy="${Math.round(cy1 - r1 * 0.07)}" r="${Math.round(r1 * 0.05)}" fill="#ffffff" fill-opacity="0.72"/>
    ${captionLayer}
  </svg>`;

  return { svg, width, height };
}
