/** Content + layout types for the jithinrp.com clone. */

export type ToolId = "figma" | "claude" | "metabase" | "confluence" | "rive";

export interface Tool {
  id: ToolId;
  /** Shown in the cursor pill, e.g. "Figma". */
  name: string;
  /** Second line of the cursor pill. */
  note: string;
}

export interface Pillar {
  title: string;
  body: string;
  /** `icon-product.svg` already ships its own grey tile, the other two sit in one. */
  icon: string;
  tiled: boolean;
}

export interface WorkMedia {
  kind: "video" | "image";
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  alt?: string;
  /** CSS backdrop used while the media loads (the source's `data-colors`). */
  colors?: string;
  /** Extra modifier class, e.g. `work__media--jove`. */
  variant: "tall" | "jove" | "lead";
}

export interface Work {
  slug: string;
  title: string;
  /** Link on the title; the whole row is clickable too. */
  href: string;
  external: boolean;
  pill: string;
  description: string[];
  timeline: string;
  role: string;
  tools: Tool[];
  recognition?: string;
  media: WorkMedia;
}

export interface AiProject {
  id: string;
  title: string;
  body: string;
  /** Local hash target for in-page modals, or an outbound URL. */
  href: string;
  external: boolean;
  pill: string;
  media:
    | { kind: "video"; src: string; poster: string; colors: string }
    | { kind: "image"; src: string; width: number; height: number; alt: string }
    | { kind: "logo"; src: string; logoSrc: string; alt: string };
}

export interface ProjectSection {
  heading: string;
  body: string;
}

export interface ProjectModal {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  media: { src: string; poster: string; layout: "tall" | "wide" | "auto" };
  sections: ProjectSection[];
  /** Parcel Sorter appends a generated image gallery (`01.webp`, `02.webp`, …). */
  gallery?: { base: string; count: number };
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Award {
  name: string;
  detail: string;
  image: string;
}

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
  pill?: string;
}
