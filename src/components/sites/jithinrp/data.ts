import type {
  AiProject,
  Award,
  NavLink,
  Pillar,
  ProjectModal,
  Testimonial,
  Tool,
  Work,
} from "@/types/jithinrp";

const A = "/sites/jithinrp/assets";

export const ASSETS = {
  landing: `${A}/landing`,
  ai: `${A}/ai`,
  trail: `${A}/about-trail`,
} as const;

export const SITE_LINKS = {
  linkedin: "https://www.linkedin.com/in/jithin-rp-220424132",
  email: "mailto:jithinpankaj@gmail.com",
  resume:
    "https://docs.google.com/document/d/1gojCiYwtixAKnPIOK_ruvJwP2F7lMiUd/export?format=pdf",
  game: "https://jithinrp.com/memory/",
} as const;

export const NAV_LINKS: NavLink[] = [
  { label: "About Me", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Works", href: "#works" },
  { label: "Play Game", href: SITE_LINKS.game },
  {
    label: "Resume",
    href: SITE_LINKS.resume,
    external: true,
    pill: "Download PDF",
  },
];

export const HERO = {
  lede: "I designed products used by 5M+ people, turning complex workflows into measurable business growth.",
  meta: ["Senior Product Designer", "9 Years", "Melbourne, AUS"],
  name: "Jithin RP",
} as const;

export const PILLARS: Pillar[] = [
  {
    title: "Product design",
    body: "I take a problem from funnel data to shipped screens and stay on it until the number moves.",
    icon: `${ASSETS.landing}/icon-product.svg`,
    tiled: false,
  },
  {
    title: "Design systems",
    body: "I build the thing that makes everyone else faster, then keep it alive after launch.",
    icon: `${ASSETS.landing}/icon-system.svg`,
    tiled: true,
  },
  {
    title: "Research that changes decisions",
    body: "I run the research myself and tie every finding to a decision someone shipped.",
    icon: `${ASSETS.landing}/icon-research.svg`,
    tiled: true,
  },
];

export const MARQUEE_WORDS = [
  "Product design",
  "Design systems",
  "Research",
  "Interaction",
  "Motion",
];

export const TOOLS: Record<Tool["id"], Tool> = {
  figma: {
    id: "figma",
    name: "Figma",
    note: "Designing UI screens and prototypes",
  },
  claude: {
    id: "claude",
    name: "Claude",
    note: "Fast progress on building and prototyping",
  },
  metabase: {
    id: "metabase",
    name: "Metabase",
    note: "Data-driven product decisions",
  },
  confluence: {
    id: "confluence",
    name: "Confluence",
    note: "Project and design documentation",
  },
  rive: {
    id: "rive",
    name: "Rive",
    note: "Interactive motion and animation",
  },
};

export const WORKS: Work[] = [
  {
    slug: "slot-booking",
    title: "Slot Booking Experience",
    href: "https://jithinrp.com/slot-booking",
    external: true,
    pill: "View case study",
    description: [
      "Users could find a venue and reach the slot selection screen, but making the final decision wasn't always straightforward. They had to figure out when their session would end, how long they were booking, what they would pay, and whether they were getting the best available option",
    ],
    timeline: "3 Months",
    role: "Sole Product Designer",
    tools: [TOOLS.figma, TOOLS.claude, TOOLS.metabase, TOOLS.confluence],
    media: {
      kind: "video",
      src: `${A}/slot-booking-trailer-story-web.mp4`,
      poster: `${A}/slot-booking-trailer-story-poster.webp`,
      colors: "#178a4c,#a9b3e6,#7fe3a9,#a4d77a",
      variant: "tall",
    },
  },
  {
    slug: "squads",
    title: "Community Experience",
    href: "https://jithinrp.com/squads",
    external: true,
    pill: "View case study",
    description: [
      "Playo already had Groups, but they were primarily a way to keep players together. The experience had limited information and no proper way to see what was happening next.",
      "We rethought Groups as Squads: a richer social space where players could understand the community, discover upcoming games, communicate and keep playing together.",
    ],
    timeline: "2 Months",
    role: "Sole Product Designer",
    tools: [TOOLS.figma, TOOLS.rive, TOOLS.claude, TOOLS.metabase, TOOLS.confluence],
    media: {
      kind: "video",
      src: `${A}/community-trailer-story-web.mp4`,
      poster: `${A}/community-trailer-story-poster.webp`,
      colors: "#e5502f,#d59be3,#ff86a0,#ffa56e",
      variant: "tall",
    },
  },
  {
    slug: "jove",
    title: "JoVE Learning Platform",
    href: "https://www.jove.com/quiz",
    external: true,
    pill: "Open link",
    description: [
      "Redesigned the Quiz and Playlist experience for JoVE's learning platform. The project was recognised as Best Team Project 2024",
    ],
    timeline: "2 Months",
    role: "Freelance Product Designer",
    tools: [TOOLS.figma, TOOLS.confluence],
    recognition: "Best Team Project 2024",
    media: {
      kind: "image",
      src: `${ASSETS.landing}/work-jove.webp`,
      width: 1536,
      height: 1024,
      alt: "JoVE quiz dashboard on a laptop",
      variant: "jove",
    },
  },
  {
    slug: "recro",
    title: "Lead Design — Research to Delivery",
    href: "https://www.recro.io/",
    external: true,
    pill: "Open link",
    description: [
      "Led end-to-end product design across 10+ client products, from research to delivery",
    ],
    timeline: "1.5 Yrs",
    role: "Sole Product Designer",
    tools: [TOOLS.figma, TOOLS.confluence],
    media: {
      kind: "image",
      src: `${ASSETS.landing}/work-lead.webp`,
      width: 1536,
      height: 1024,
      alt: "Recro landing page on a laptop",
      variant: "lead",
    },
  },
];

export const GENAI_INTRO =
  "From creative automation to hiring intelligence, these projects explore how AI can augment workflows rather than replace human decision-making";

export const AI_PROJECTS: AiProject[] = [
  {
    id: "parcel-sorter",
    title: "Australia Post Parcel Sorter",
    body: "A one-scan app that tells a post office where every parcel goes (Town, Country, PO Box or Counter), so the morning sort makes the 7 AM van.",
    href: "#parcel-sorter",
    external: false,
    pill: "View project",
    media: {
      kind: "video",
      src: `${ASSETS.ai}/parcel-sorter/preview.mp4`,
      poster: `${ASSETS.ai}/parcel-sorter/poster.webp`,
      colors: "#1f7a4d,#c48412,#2c5fc9,#b2303b",
    },
  },
  {
    id: "undo",
    title: "UNDO",
    body: "A calm iPhone puzzle: pull strands and tilt the phone to untangle glossy 3D knots, with one quiet invitation a day.",
    href: "#undo",
    external: false,
    pill: "Watch trailer",
    media: {
      kind: "video",
      src: `${ASSETS.ai}/undo/preview.mp4`,
      poster: `${ASSETS.ai}/undo/poster.webp`,
      colors: "#0b0b12,#6f78c4,#2a2c4a,#9aa3e0",
    },
  },
  {
    id: "stickskate",
    title: "Stickskate",
    body: "An endless stickman skateboarding game drawn in ink on paper, with slow-motion flips across city, jungle, desert, beach and snow.",
    href: "#stickskate",
    external: false,
    pill: "Watch trailer",
    media: {
      kind: "video",
      src: `${ASSETS.ai}/stickskate/preview.mp4`,
      poster: `${ASSETS.ai}/stickskate/poster.webp`,
      colors: "#f2e8d0,#d9ead0,#f0e1b8,#dfe7ee",
    },
  },
  {
    id: "canditracker",
    title: "CandiTracker - Internal ATS",
    body: "An AI-powered applicant tracking system that helps evaluate, rank and manage designer candidates with structured hiring workflows.",
    href: "https://canditracker.vercel.app/",
    external: true,
    pill: "Open link",
    media: {
      kind: "image",
      src: `${ASSETS.landing}/ai-canditracker.webp`,
      width: 800,
      height: 800,
      alt: "CandiTracker dashboard",
    },
  },
  {
    id: "looped",
    title: "Looped",
    body: "Recolour Lottie animations instantly using AI-assisted vector editing, with exports for JSON, SVG and GIF.",
    href: "https://tintloop.netlify.app/",
    external: true,
    pill: "Open link",
    media: {
      kind: "image",
      src: `${ASSETS.landing}/ai-looped.webp`,
      width: 800,
      height: 800,
      alt: "Looped recolouring a Lottie animation",
    },
  },
  {
    id: "logoplay",
    title: "LogoPlay",
    body: "A visual playground for designing logos with shape builder, clipping tools, preset shapes and a pen tool — no design experience required.",
    href: "https://logoplay.vercel.app/",
    external: true,
    pill: "Open link",
    media: {
      kind: "logo",
      src: `${ASSETS.landing}/ai-logoplay-bg.webp`,
      logoSrc: `${ASSETS.landing}/ai-logoplay-logo.webp`,
      alt: "Clouds behind the LogoPlay mark",
    },
  },
];

export const ABOUT = {
  title: "About Me",
  paragraphs: [
    "I'm Jithin, a product designer inspired by people, places, and how they move. I sketch, I travel, and I play badminton, pickleball and cricket.",
    "At home it's usually a small tool I'm building with AI. Lately, more design events around Melbourne, mostly to meet people.",
  ],
  photo: `${ASSETS.landing}/about-photo.webp`,
  trail: [1, 2, 3, 4, 5, 6].map((n) => `${ASSETS.trail}/${n}.webp`),
};

export const AWARDS: Award[] = [
  {
    name: "Google Play",
    detail: "Inspiring App, 2023",
    image: `${ASSETS.landing}/award-googleplay.webp`,
  },
  {
    name: "Lottiefiles",
    detail: "Animator of the week, 2019",
    image: `${ASSETS.landing}/award-lottie.png`,
  },
  {
    name: "Wall of Portfolios",
    detail: "Featured, 2026",
    image: `${ASSETS.landing}/award-wall.png`,
  },
];

export const QUOTES_TITLE =
  "Your satisfaction is my priority. See what others have to say";

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Jithin’s impact at Playo went beyond design. During COVID, he took a salary reduction to help support the wider team. He brought that same ownership to his work, always pushing for quality and perfection while keeping business impact at the centre. He has been a valuable part of Playo’s growth over the years.",
    name: "Gauravjeet Singh",
    role: "CEO @ Playo",
    avatar: `${ASSETS.landing}/avatar-gauravjeet.webp`,
  },
  {
    quote:
      "Worked with Jithin at Playo and found him reliable, proactive, and easy to work with. He takes ownership, communicates clearly, and always follows through on his work. I’d happily recommend him to any team looking for a great designer.",
    name: "Amit Roushan",
    role: "Product @ Ethos, Co-Founder @ Playo",
    avatar: `${ASSETS.landing}/avatar-amit.png`,
  },
  {
    quote:
      "Jithin was my mentor during my first product design internship at Playo. He’s a thoughtful, skilled designer who genuinely listens, encourages different perspectives, and generously shares his knowledge. Always open to experimenting and innovating, he’s someone I’d happily recommend to any team.",
    name: "Darryl Raphael",
    role: "Product Designer @ Cult",
    avatar: `${ASSETS.landing}/avatar-darryl.webp`,
  },
  {
    quote:
      "Jithin helped me create some great creative banners that have been installed across premium venues. His eye for detail and ability to translate ideas into strong visual communication made a real impact.",
    name: "Dhiraj Bhat",
    role: "Deputy Head of Operations @ Playo",
    avatar: `${ASSETS.landing}/avatar-dhiraj.webp`,
  },
  {
    quote:
      "Jithin designs with development in mind, making handoffs clear and practical. His attention to interaction details helps us ship polished experiences faster.",
    name: "Rohith Thammaiah",
    role: "Front-end Lead @ Playo",
    avatar: `${ASSETS.landing}/avatar-rohith.webp`,
  },
];

export const CONTACT = {
  title: "Looking for your next product designer?",
  sub: "I'd love to hear what you're building and explore how I could contribute",
  links: [
    { label: "Email", href: SITE_LINKS.email, external: false },
    { label: "LinkedIn", href: SITE_LINKS.linkedin, external: true },
    {
      label: "Resume",
      href: SITE_LINKS.resume,
      external: true,
      pill: "Download PDF",
    },
  ],
} as const;

export const PROJECT_MODALS: ProjectModal[] = [
  {
    id: "parcel-sorter",
    eyebrow: "Side project · Post office mornings",
    title: "Australia Post Parcel Sorter",
    lede: "One scan tells you where a parcel goes: Town, Country, PO Box or Counter. I built it while working mornings as a store assistant, alongside the two owners.",
    media: {
      src: `${ASSETS.ai}/parcel-sorter/preview.mp4`,
      poster: `${ASSETS.ai}/parcel-sorter/poster.webp`,
      layout: "auto",
    },
    sections: [
      {
        heading: "The 7 AM van",
        body: "I started at 5:30. Parcels arrive in crates, and each one has to be sorted to Town, Country, PO Box or the counter before the delivery van collects at 7 sharp. We were always late: 30+ parcels a day missed the van and waited until the next morning.",
      },
      {
        heading: "The rule was easy. The exceptions weren't.",
        body: "Streets, drives and places go to Town; roads and lanes go to Country. But some roads go to Town, some streets go to Country, and some customers ask to collect from the counter. All of that lived in one printed sheet, so every parcel meant a lookup. In my first days I checked every single one against it.",
      },
      {
        heading: "More hands, or fewer lookups?",
        body: "On my first two days I talked to the owners. Their plan was to hire two more people. But the slow part wasn't carrying parcels; it was checking the sheet. More people would just mean more people looking things up.",
      },
      {
        heading: "One scan, one answer",
        body: "I loaded the sheet into a simple scanner app. Scan a label and the screen answers in colour and in words: Town, Country, PO Box or Counter, exceptions included. No reading the sheet, no remembering which roads break the rule.",
      },
      {
        heading: "The counter, too",
        body: "Held parcels piled up at the counter, often 20+, and finding one meant searching while a queue grew. With the same app, a quick check showed whether a customer's parcel was there, so we could pick it and hand it over.",
      },
      {
        heading: "What changed",
        body: "Sorting got faster and far easier. I was finishing before the owners, who had done it for years, and pickups went from searching a pile to a quick look.",
      },
    ],
    gallery: { base: `${ASSETS.ai}/parcel-sorter/`, count: 8 },
  },
  {
    id: "undo",
    eyebrow: "iPhone game · Coming soon to the App Store",
    title: "UNDO",
    lede: "A calm puzzle about loosening knots. Pull a strand and feel it give; tilt the phone and the loose loops fall that way.",
    media: {
      src: `${ASSETS.ai}/undo/trailer.mp4`,
      poster: `${ASSETS.ai}/undo/trailer-poster.webp`,
      layout: "tall",
    },
    sections: [
      {
        heading: "Pull, tilt, untangle",
        body: "Each puzzle is a glossy 3D knot. You pull strands one at a time and tilt the phone to let loose loops slide, until the tangle opens into clean rings.",
      },
      {
        heading: "A quiet invitation",
        body: "You choose your rhythm. With your permission, UNDO sends one quiet notification at the times you pick: nothing during quiet hours, and nothing if you skip a day.",
      },
      {
        heading: "Keep what you solve",
        body: "Solved knots collect in a gallery, with badges and a profile that grow as you go.",
      },
    ],
  },
  {
    id: "stickskate",
    eyebrow: "iPhone & iPad game · SwiftUI + SpriteKit",
    title: "Stickskate",
    lede: "An endless stickman skateboarding game drawn in ink on paper. Skate as far as you can through a built skate-park course.",
    media: {
      src: `${ASSETS.ai}/stickskate/trailer.mp4`,
      poster: `${ASSETS.ai}/stickskate/trailer-poster.webp`,
      layout: "wide",
    },
    sections: [
      {
        heading: "Simple to play",
        body: "Swipe up or tap to jump, swipe down to duck under bars. You can pick it up in seconds.",
      },
      {
        heading: "Tricks in slow motion",
        body: "When you catch air, time slows and the camera moves in close. Swipe for a backflip, kickflip, 360 shove-it or grab, and chain them in one jump for combo coins. Land too early and you bail.",
      },
      {
        heading: "A real skate park",
        body: "Kickers, decks, grind rails, ledges, roofs, stairs, loop barrels and rooftop gaps, across five places that blend into each other: city, jungle, desert, beach and snow. It gets faster every 500 m, up to 5,000 m.",
      },
      {
        heading: "Collect and compete",
        body: "Badges for stunts and big runs, your top 10 plus Game Center leaderboards, boosters, and custom tracks you can share as a challenge.",
      },
    ],
  },
];
