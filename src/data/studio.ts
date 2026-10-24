export type ProjectCategory =
  | "All"
  | "3D & WebGL"
  | "Interactive Web"
  | "Spatial & XR"
  | "Motion & Film"
  | "R&D Concept";

export interface CaseStudyGalleryFrame {
  id: string;
  caption: string;
  tag: string;
  shaderSeed: number;
  aspect: "wide" | "tall" | "square";
  palette: [string, string, string];
}

export interface StudioProject {
  slug: string;
  index: string;
  title: string;
  client: string;
  year: string;
  category: Exclude<ProjectCategory, "All">;
  disciplines: string[];
  featured: boolean;
  tagline: string;
  summary: string;
  challenge: string;
  solution: string;
  architectureNote: string;
  accentHex: string;
  secondaryHex: string;
  darkBgHex: string;
  shaderPreset: "monolith" | "kestrel" | "meridian" | "sylva" | "hyperion" | "aether";
  metrics: { label: string; value: string }[];
  services: string[];
  recognition: { org: string; award: string }[];
  liveUrlLabel: string;
  gallery: CaseStudyGalleryFrame[];
}

export const STUDIO_PROJECTS: StudioProject[] = [
  {
    slug: "monolith-one",
    index: "01",
    title: "Monolith One",
    client: "Kineta Internal Campaign",
    year: "2026",
    category: "R&D Concept",
    disciplines: ["concept", "web", "design", "webgl", "3d", "satire"],
    featured: true,
    tagline:
      "Turning a milled block of brushed tungsten desk ballast into an ultra-serious spatial hardware keynote.",
    summary:
      "Monolith One began as an internal studio dare: could pure optical craft, tactile camera choreography, and deadpan industrial storytelling convince viewers that a zero-watt desk weight was the decade's most coveted computing device?",
    challenge:
      "Hardware launch sites routinely drown behind 60 MB image sequences that stall on mobile connections. We set out to deliver cinema-grade brushed metal anisotropy, optical glass refraction, and millimeter-accurate explode views under a 900 KB initial asset budget.",
    solution:
      "We authored a procedural PBR surface kernel combining analytic GGX microfacet specular lobes with Snell's Law chromatic dispersion, paired with scroll-scrubbed exploded CAD callouts and Web Audio foley clicks synced to scroll detents.",
    architectureNote:
      "Zero baked textures: brushed grain is synthesized procedurally in tangent space via multi-octave anisotropic noise derivatives at 120 FPS.",
    accentHex: "#4d5bff",
    secondaryHex: "#00d2ff",
    darkBgHex: "#080b14",
    shaderPreset: "monolith",
    metrics: [
      { label: "Frame Budget", value: "120 FPS" },
      { label: "Scene Payload", value: "640 KB" },
      { label: "Launch Visits", value: "410K+" },
      { label: "Avg. Dwell", value: "04m 18s" },
    ],
    services: [
      "Campaign Concept",
      "Industrial Art Direction",
      "Custom GLSL Optics",
      "Interactive Web Engineering",
      "Procedural Sound Design",
      "Launch Film",
    ],
    recognition: [
      { org: "Awwwards", award: "Site of the Month" },
      { org: "Awwwards", award: "Developer Award" },
      { org: "FWA", award: "FWA of the Day" },
    ],
    liveUrlLabel: "monolith.kineta.studio",
    gallery: [
      {
        id: "m-01",
        caption: "Anisotropic tungsten bevel study under procedural three-point softbox lighting.",
        tag: "OPTICAL SHADER PASS",
        shaderSeed: 1.15,
        aspect: "wide",
        palette: ["#090d1a", "#3142ff", "#8ef0ff"],
      },
      {
        id: "m-02",
        caption: "Exploded internal ballast chamber with live scroll-calibrated vernier telemetry.",
        tag: "CAD TELEMETRY UI",
        shaderSeed: 2.4,
        aspect: "square",
        palette: ["#0d1018", "#5b68ff", "#ffffff"],
      },
      {
        id: "m-03",
        caption: "Cauchy spectral rim dispersion across chamfered sapphire lens cap.",
        tag: "SNELL DISPERSION",
        shaderSeed: 3.7,
        aspect: "square",
        palette: ["#070910", "#00d2ff", "#ff4d2e"],
      },
      {
        id: "m-04",
        caption: "Responsive mobile touch-orbit stage maintaining 60 FPS on mid-tier devices.",
        tag: "ADAPTIVE DPR",
        shaderSeed: 4.9,
        aspect: "wide",
        palette: ["#0c1020", "#2434ff", "#a8b4ff"],
      },
    ],
  },
  {
    slug: "kestrel-robotics",
    index: "02",
    title: "Kestrel Dynamics",
    client: "Kestrel Autonomous Systems",
    year: "2026",
    category: "3D & WebGL",
    disciplines: ["strategy", "web", "3d", "simulation", "development"],
    featured: true,
    tagline:
      "A real-time digital twin platform unveiling next-generation harmonic actuators and autonomous flight frames.",
    summary:
      "Kestrel builds ultra-high-torque micro-actuators powering industrial inspection drones and dexterous robotics. We partnered with their engineering leadership to transform dense mechanical whitepapers into a tactile, interactive factory-to-flight story.",
    challenge:
      "Prospective aerospace partners needed immediate clarity on torque-to-mass ratios, thermal dissipation, and modular joint integration without sitting through static PDF decks.",
    solution:
      "We engineered an interactive kinematic assembly stage where visitors scrub directly from raw stator windings to multi-rotor flight telemetry, backed by clean Swiss data typography and instant spec comparison matrices.",
    architectureNote:
      "Instanced mechanical sub-assemblies share a single draw call with quaternion bone matrices interpolated on the vertex shader.",
    accentHex: "#ff5533",
    secondaryHex: "#ffb088",
    darkBgHex: "#0d0b0a",
    shaderPreset: "kestrel",
    metrics: [
      { label: "Draw Calls", value: "6 Total" },
      { label: "Enterprise Leads", value: "+285%" },
      { label: "Desktop Lighthouse", value: "98 / 100" },
      { label: "Interactive Parts", value: "140+" },
    ],
    services: [
      "Digital Strategy",
      "Technical Art Direction",
      "CAD-to-WebGL Pipeline",
      "Design System",
      "Next.js Engineering",
    ],
    recognition: [
      { org: "Awwwards", award: "Site of the Day" },
      { org: "FWA", award: "FWA of the Day" },
      { org: "CSSDA", award: "Best UI / UX / Innovation" },
    ],
    liveUrlLabel: "kestrel.kineta.studio",
    gallery: [
      {
        id: "k-01",
        caption: "Harmonic drive stator cross-section with real-time thermal heatmap overlay.",
        tag: "THERMAL FIELD",
        shaderSeed: 5.2,
        aspect: "wide",
        palette: ["#120c0a", "#ff4d2e", "#ffd1b3"],
      },
      {
        id: "k-02",
        caption: "Precision flight controller telemetry HUD built strictly on an 8px grid.",
        tag: "TELEMETRY SYSTEM",
        shaderSeed: 6.6,
        aspect: "square",
        palette: ["#101216", "#ff6a3d", "#f4f6fb"],
      },
      {
        id: "k-03",
        caption: "Automated manufacturing cell timeline synced to smooth scroll velocity.",
        tag: "SCROLL KINEMATICS",
        shaderSeed: 7.3,
        aspect: "square",
        palette: ["#0c0e13", "#ff944d", "#38bdf8"],
      },
      {
        id: "k-04",
        caption: "Wind-shear vector particle stream visualizing rotor downwash efficiency.",
        tag: "GPU PARTICLES",
        shaderSeed: 8.1,
        aspect: "wide",
        palette: ["#090b10", "#ff4d2e", "#ffffff"],
      },
    ],
  },
  {
    slug: "meridian-os",
    index: "03",
    title: "Meridian Compute",
    client: "Meridian Labs",
    year: "2025",
    category: "Interactive Web",
    disciplines: ["web", "design", "development", "3d", "motion"],
    featured: true,
    tagline:
      "Making distributed neural compiler infrastructure feel effortless, luminous, and human.",
    summary:
      "Meridian orchestrates heterogeneous GPU clusters across three continents with sub-millisecond routing. Our task was to design and ship their flagship launch site, interactive benchmark explorer, and documentation shell.",
    challenge:
      "Developer infrastructure brands often oscillate between sterile enterprise tables and impenetrable neon clichés. Meridian needed calm authority with moments of unmistakable real-time magic.",
    solution:
      "We paired crisp architectural ice surfaces with an interactive optical routing lattice that visualizes live packet scheduling as refractive light pulses, seamlessly transitioning into dark-mode code sandboxes.",
    architectureNote:
      "Hybrid DOM + WebGL scroll synchronization ensures zero pixel drift between live benchmark charts and 3D node connectors.",
    accentHex: "#00c8ff",
    secondaryHex: "#3b5bff",
    darkBgHex: "#070d14",
    shaderPreset: "meridian",
    metrics: [
      { label: "CLS Score", value: "0.00" },
      { label: "Sign-Up Conversion", value: "3.4×" },
      { label: "TTI (4G Mobile)", value: "1.4s" },
      { label: "Docs Satisfaction", value: "99.1%" },
    ],
    services: [
      "Brand Interactive Identity",
      "Design System Tokens",
      "WebGL Topology Visualizer",
      "Front-End Architecture",
    ],
    recognition: [
      { org: "Awwwards", award: "Site of the Day" },
      { org: "Webby Awards", award: "Best Technical Achievement" },
    ],
    liveUrlLabel: "meridian.kineta.studio",
    gallery: [
      {
        id: "mr-01",
        caption: "Global optical packet routing mesh rendered with additive Fresnel spline tubes.",
        tag: "TOPOLOGY SHADER",
        shaderSeed: 9.4,
        aspect: "wide",
        palette: ["#061019", "#00d2ff", "#4d5bff"],
      },
      {
        id: "mr-02",
        caption: "Interactive latency comparator scrubbing from 1 to 4,096 concurrent nodes.",
        tag: "DATA MOTION",
        shaderSeed: 10.2,
        aspect: "square",
        palette: ["#0a131f", "#10d98c", "#a5f3fc"],
      },
      {
        id: "mr-03",
        caption: "Light-to-dark surface handoff engineered with zero repaint thrashing.",
        tag: "SURFACE ENGINE",
        shaderSeed: 11.7,
        aspect: "square",
        palette: ["#101826", "#38bdf8", "#ffffff"],
      },
      {
        id: "mr-04",
        caption: "Component token library shared across marketing site and cloud console.",
        tag: "DESIGN SYSTEM",
        shaderSeed: 12.5,
        aspect: "wide",
        palette: ["#080d16", "#2434ff", "#67e8f9"],
      },
    ],
  },
  {
    slug: "sylva-botanica",
    index: "04",
    title: "Sylva: Living Archive",
    client: "Nordic Seed Vault Initiative",
    year: "2025",
    category: "3D & WebGL",
    disciplines: ["concept", "web", "procedural 3d", "spatial audio", "storytelling"],
    featured: true,
    tagline:
      "An interactive procedural ecosystem celebrating rare alpine flora through generative growth shaders.",
    summary:
      "Commissioned as an open cultural exhibition, Sylva invites visitors to cultivate endangered botanical specimens in real time as seasonal temperature, wind vectors, and soil acoustics shift around their cursor.",
    challenge:
      "Rendering organic translucent petals, thousands of wind-reactive stamens, and atmospheric pollen particles in mobile browsers without pre-rendered video loops.",
    solution:
      "We built a parametric L-system vertex growth solver combined with subsurface scattering approximations in GLSL, coupled with generative spatial chimes tuned to harmonic botanical ratios.",
    architectureNote:
      "Subsurface translucency uses view-dependent thickness estimation in a single forward pass with zero shadow-map overhead.",
    accentHex: "#10d98c",
    secondaryHex: "#a3e635",
    darkBgHex: "#07120e",
    shaderPreset: "sylva",
    metrics: [
      { label: "Procedural Species", value: "24" },
      { label: "Pollen Particles", value: "12,000" },
      { label: "Exhibition Visitors", value: "680K" },
      { label: "A11y Audit", value: "100 / 100" },
    ],
    services: [
      "Exhibition Direction",
      "Procedural Growth Shaders",
      "Generative Web Audio",
      "Accessible Narrative UI",
    ],
    recognition: [
      { org: "Webby Awards", award: "Winner — Best Visual Design" },
      { org: "Awwwards", award: "Site of the Day" },
      { org: "CommArts", award: "Award of Excellence" },
    ],
    liveUrlLabel: "sylva.kineta.studio",
    gallery: [
      {
        id: "s-01",
        caption: "Subsurface translucent petal shader responding to cursor sunlight angle.",
        tag: "SSS APPROXIMATION",
        shaderSeed: 13.8,
        aspect: "wide",
        palette: ["#061510", "#10d98c", "#bef264"],
      },
      {
        id: "s-02",
        caption: "Curl-noise spore drift field driven by seasonal wind velocity curves.",
        tag: "CURL ADVECTION",
        shaderSeed: 14.4,
        aspect: "square",
        palette: ["#091a14", "#34d399", "#ecfccb"],
      },
      {
        id: "s-03",
        caption: "Botanical taxonomy index with keyboard-first specimen focus mode.",
        tag: "ARCHIVE UX",
        shaderSeed: 15.1,
        aspect: "square",
        palette: ["#0b1915", "#2dd4bf", "#ffffff"],
      },
      {
        id: "s-04",
        caption: "Full exhibition darkroom mode optimized for OLED displays.",
        tag: "COLOR SCIENCE",
        shaderSeed: 16.9,
        aspect: "wide",
        palette: ["#040d0a", "#10b981", "#99f6e4"],
      },
    ],
  },
  {
    slug: "hyperion-gt",
    index: "05",
    title: "Hyperion Aero Study",
    client: "Hyperion Coachworks",
    year: "2025",
    category: "Motion & Film",
    disciplines: ["concept", "3d art", "motion design", "realtime installation", "webgl"],
    featured: true,
    tagline:
      "Four decades of grand-touring aerodynamics sculpted through real-time wind-tunnel ribbons and 16K LED cinema.",
    summary:
      "Created simultaneously as a wraparound architectural LED installation in Tokyo and an interactive WebGL companion experience, Hyperion Aero Study traces how airflow sculpts pure automotive form.",
    challenge:
      "Unifying an ultra-wide 16K physical installation pipeline with a 60 FPS browser experience so visitors on mobile could step inside the exact same aerodynamic streamlines.",
    solution:
      "We shared core SDF vehicle silhouettes and curl-ribbon shader math across offline path-traced plates and our live Three.js companion stage, allowing real-time yaw angle and Mach number scrubbing.",
    architectureNote:
      "Streamline ribbons compute analytical vortex shedding around an implicit signed-distance body in real time.",
    accentHex: "#a855f7",
    secondaryHex: "#ec4899",
    darkBgHex: "#0d0814",
    shaderPreset: "hyperion",
    metrics: [
      { label: "LED Canvas", value: "16K Wrap" },
      { label: "Gallery Attendance", value: "95,000" },
      { label: "Web Companion FPS", value: "60–120" },
      { label: "Streamlines", value: "2,400" },
    ],
    services: [
      "Film & Installation Direction",
      "Procedural Aero Simulation",
      "Companion WebGL Microsite",
      "Spatial Soundscape",
    ],
    recognition: [
      { org: "D&AD", award: "Wood Pencil — Digital Design" },
      { org: "FWA", award: "FWA of the Month" },
    ],
    liveUrlLabel: "hyperion.kineta.studio",
    gallery: [
      {
        id: "h-01",
        caption: "Laminar-to-vortex wake transition across sculpted carbon rear diffuser.",
        tag: "AERO RIBBONS",
        shaderSeed: 17.6,
        aspect: "wide",
        palette: ["#0e0717", "#9333ea", "#f472b6"],
      },
      {
        id: "h-02",
        caption: "Four-era silhouette morph controlled by continuous scroll scrub.",
        tag: "SDF MORPHING",
        shaderSeed: 18.3,
        aspect: "square",
        palette: ["#13091f", "#c084fc", "#ffffff"],
      },
      {
        id: "h-03",
        caption: "16K LED wall calibration grid and multi-screen synchronization telemetry.",
        tag: "INSTALLATION SYNC",
        shaderSeed: 19.5,
        aspect: "square",
        palette: ["#0c0814", "#ec4899", "#fbcfe8"],
      },
      {
        id: "h-04",
        caption: "Studio reflection lut crafted to match nocturnal Tokyo rain reflections.",
        tag: "CUSTOM LUT",
        shaderSeed: 20.8,
        aspect: "wide",
        palette: ["#090610", "#7c3aed", "#38bdf8"],
      },
    ],
  },
  {
    slug: "aether-spatial",
    index: "06",
    title: "Aether Spatial",
    client: "Resonance Architecture Lab",
    year: "2024",
    category: "Spatial & XR",
    disciplines: ["webxr", "spatial audio", "3d", "shaders", "interaction"],
    featured: true,
    tagline:
      "WebXR mixed-reality acoustic sculptures transforming physical rooms into playable harmonic chambers.",
    summary:
      "Aether Spatial turns any browser-capable headset or desktop viewport into a room-scale acoustic instrument where floating liquid-glass resonators respond to hand gestures, room planes, and voice pitch.",
    challenge:
      "Delivering zero-install browser WebXR at locked 90 Hz stereo frame rates while maintaining an equally magical mouse-and-keyboard desktop experience.",
    solution:
      "We built a single-pass analytical raymarched metaball & glass resonator shader with zero dynamic memory allocations per frame, seamlessly scaling from stereo WebXR down to mobile touch.",
    architectureNote:
      "Stereo WebXR rendering maintains < 6.4ms GPU frame time via analytical normal derivation and zero post-FX passes.",
    accentHex: "#38bdf8",
    secondaryHex: "#818cf8",
    darkBgHex: "#070c16",
    shaderPreset: "aether",
    metrics: [
      { label: "XR Frame Lock", value: "90 Hz" },
      { label: "GPU Frame Time", value: "5.8 ms" },
      { label: "Install Friction", value: "0 MB App" },
      { label: "Session Completion", value: "91%" },
    ],
    services: [
      "WebXR Architecture",
      "Raymarched Optical Shaders",
      "Hand-Tracking Interaction",
      "Spatial Web Audio",
    ],
    recognition: [
      { org: "Awwwards", award: "Site of the Day" },
      { org: "Lovie Awards", award: "Gold — XR & Spatial" },
    ],
    liveUrlLabel: "aether.kineta.studio",
    gallery: [
      {
        id: "ae-01",
        caption: "Room-anchored harmonic glass resonators reflecting real-world light probes.",
        tag: "WEBXR PASSTHROUGH",
        shaderSeed: 21.2,
        aspect: "wide",
        palette: ["#070d19", "#38bdf8", "#818cf8"],
      },
      {
        id: "ae-02",
        caption: "Pinch-gesture frequency ribbon with haptic visual ripple detent.",
        tag: "HAND INTERACTION",
        shaderSeed: 22.9,
        aspect: "square",
        palette: ["#0a1122", "#60a5fa", "#ffffff"],
      },
      {
        id: "ae-03",
        caption: "Analytical raymarched metaball union blending seamlessly on contact.",
        tag: "SDF SMOOTH UNION",
        shaderSeed: 23.4,
        aspect: "square",
        palette: ["#080e1c", "#818cf8", "#2dd4bf"],
      },
      {
        id: "ae-04",
        caption: "Desktop fallback stage preserving full harmonic playability with pointer & keyboard.",
        tag: "UNIVERSAL ACCESS",
        shaderSeed: 24.7,
        aspect: "wide",
        palette: ["#060a14", "#2434ff", "#7dd3fc"],
      },
    ],
  },
];

export interface CapabilityPillar {
  code: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  accent: string;
}

export const CAPABILITY_PILLARS: CapabilityPillar[] = [
  {
    code: "S",
    index: "01",
    title: "Strategy",
    subtitle: "Defining the technical & narrative north star before a single polygon is placed.",
    description:
      "We partner directly with founders, product leaders, and brand directors to identify the single interactive idea that turns complex technology into unmistakable conviction.",
    deliverables: [
      "Experience & Narrative Architecture",
      "Real-Time Feasibility & R&D Prototyping",
      "Creative & Technical Direction",
      "Performance & Platform Budgeting",
      "Interactive Campaign Roadmapping",
    ],
    accent: "#5b68ff",
  },
  {
    code: "C",
    index: "02",
    title: "Creative",
    subtitle: "Architectural typography, kinetic design systems, and tactile art direction.",
    description:
      "Every pixel, curve, and micro-detent is designed as one cohesive visual world—where typography, 3D form, light, and sound reinforce each other seamlessly.",
    deliverables: [
      "3D Art Direction & Look Development",
      "Interactive UX / UI & Design Systems",
      "Motion Choreography & Storyboarding",
      "Bespoke Shader Look-Dev",
      "Procedural Sound & UI Foley Direction",
    ],
    accent: "#00d2ff",
  },
  {
    code: "T",
    index: "03",
    title: "Technology",
    subtitle: "Custom WebGL kernels, fluid scroll engines, and resilient production code.",
    description:
      "We engineer from first principles—writing custom GLSL optical shaders, zero-allocation physics loops, and accessible Next.js architectures built for 60–120 FPS across devices.",
    deliverables: [
      "Custom Three.js / React Three Fiber / WebGPU",
      "GLSL Raymarching, Refraction & Particle Shaders",
      "Full-Stack Next.js & TypeScript Engineering",
      "WebXR & Interactive Physical Installations",
      "Automated FPS Watchdog & Mobile Degradation",
    ],
    accent: "#10d98c",
  },
  {
    code: "P",
    index: "04",
    title: "Production",
    subtitle: "Procedural geometry pipelines engineered for featherweight web delivery.",
    description:
      "From parametric CAD decimation to procedural material synthesis, our production pipeline delivers film-grade visual fidelity inside sub-megabyte browser budgets.",
    deliverables: [
      "Procedural Geometry & Instanced Asset Systems",
      "Draco / Meshopt / KTX2 Compression Pipelines",
      "Real-Time Lighting & Studio Reflection Rigs",
      " physics & Cloth Simulation",
      "Cross-Browser QA & Lighthouse Optimization",
    ],
    accent: "#ff5533",
  },
];

export interface LabExperiment {
  id: string;
  index: 0 | 1 | 2 | 3;
  code: string;
  title: string;
  category: string;
  fpsTarget: string;
  summary: string;
  plainEnglishShaderIdea: string;
  preset: {
    ior: number;
    dispersion: number;
    turbulence: number;
    spring: number;
    wireframe: boolean;
  };
}

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: "optical-dispersion",
    index: 0,
    code: "EXP // 001",
    title: "Cauchy Optical Glass Core",
    category: "Refraction & Dispersion GLSL",
    fpsTarget: "120 FPS",
    summary:
      "Real-time wavelength-dependent refraction splitting red, green, and blue rays across curved crystal normals using Snell's Law and Schlick Fresnel.",
    plainEnglishShaderIdea:
      "Instead of blurring the background like CSS backdrop-filter, the vertex shader bends surface geometry with layered 3D noise while the fragment shader calculates three slightly different indices of refraction (Red = IOR - d, Green = IOR, Blue = IOR + d). Looking straight on stays crystal clear; grazing angles flare into prism rainbows.",
    preset: { ior: 1.48, dispersion: 0.42, turbulence: 0.38, spring: 0.65, wireframe: false },
  },
  {
    id: "curl-advection",
    index: 1,
    code: "EXP // 002",
    title: "Divergence-Free Curl Swarm",
    category: "GPU Vector Field & Physics",
    fpsTarget: "120 FPS",
    summary:
      "48 instanced metallic & luminescent spheres coupled with 1,600 curl-noise field particles responding simultaneously to pointer repulsion.",
    plainEnglishShaderIdea:
      "Ordinary random particle motion looks jittery because particles collide or clump. Taking the mathematical curl (90-degree rotational derivative) of 3D simplex noise produces swirling fluid currents that never compress to a single point, giving particles the organic feel of ink suspended in water.",
    preset: { ior: 1.32, dispersion: 0.22, turbulence: 0.78, spring: 0.85, wireframe: false },
  },
  {
    id: "harmonic-lattice",
    index: 2,
    code: "EXP // 003",
    title: "Harmonic Wave Cloth Matrix",
    category: "Vertex Displacement & Caustics",
    fpsTarget: "120 FPS",
    summary:
      "High-subdivision parametric silk membrane undulating under interfering standing waves and cursor-driven ripple impulses.",
    plainEnglishShaderIdea:
      "A flat sheet of vertices is lifted along its surface normal by summing three travelling sine-noise waves running at golden-ratio angles. Recomputing surface normals analytically inside the shader creates liquid satin highlights without CPU mesh updates.",
    preset: { ior: 1.62, dispersion: 0.55, turbulence: 0.64, spring: 0.45, wireframe: false },
  },
  {
    id: "wire-topology",
    index: 3,
    code: "EXP // 004",
    title: " Geodesic Tensegrity Cage",
    category: "Structural Wireframe Study",
    fpsTarget: "120 FPS",
    summary:
      "Exposed icosahedral tensegrity lattice revealing real-time vertex deformation vectors, normal coloring, and spring-damped angular momentum.",
    plainEnglishShaderIdea:
      "Toggles GPU wireframe rasterization over our deformed high-order icosahedron so engineers and art directors can inspect triangle density, silhouette smoothness, and spring overshoot directly in motion.",
    preset: { ior: 1.4, dispersion: 0.3, turbulence: 0.48, spring: 0.92, wireframe: true },
  },
];

export interface TeamMember {
  id: string;
  index: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  accent: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "kenji-takahashi",
    index: "001",
    name: "Kenji Takahashi",
    role: "Co-Founder & Executive Creative Director",
    location: "Osaka, JP",
    bio: "Architects unified visual worlds bridging procedural simulation, tactile typography, and real-time optical shader systems.",
    accent: "#2434ff",
  },
  {
    id: "clara-vance",
    index: "002",
    name: "Clara Vance",
    role: "Co-Founder & Principal Graphics Engineer",
    location: "Bristol, UK",
    bio: "Specializes in custom WebGL/WebGPU renderers, zero-allocation physics solvers, and high-frame-rate mobile degradation.",
    accent: "#00d2ff",
  },
  {
    id: "mateo-silva",
    index: "003",
    name: "Mateo Silva",
    role: "Technical Art Director",
    location: "Lisbon, PT",
    bio: "Leads procedural geometry workflows, CAD-to-browser compression pipelines, and real-time studio lighting rigs.",
    accent: "#ff5533",
  },
  {
    id: "sora-hayashi",
    index: "004",
    name: "Sora Hayashi",
    role: "Lead Motion & Interaction Designer",
    location: "Tokyo, JP",
    bio: "Crafts scroll choreography, tactile micro-interactions, and accessible design systems grounded in Swiss grid discipline.",
    accent: "#10d98c",
  },
  {
    id: "nadia-koury",
    index: "005",
    name: "Nadia Koury",
    role: "Spatial Audio & XR Prototyper",
    location: "Montreal, CA",
    bio: "Builds generative Web Audio synthesizers, hand-tracked WebXR environments, and multi-screen installation sync.",
    accent: "#a855f7",
  },
  {
    id: "henrik-lind",
    index: "006",
    name: "Henrik Lind",
    role: "Executive Producer",
    location: "London, UK",
    bio: "Guides ambitious global launches from initial R&D spike through zero-regression production delivery.",
    accent: "#f59e0b",
  },
];

export const CLIENT_PARTNERS = [
  { name: "Kestrel Aero", glyph: "K//" },
  { name: "Meridian Cloud", glyph: "MRD" },
  { name: "Hyperion GT", glyph: "HYP" },
  { name: "Nordic Vault", glyph: "NV·" },
  { name: "Resonance Lab", glyph: "RSN" },
  { name: "Kansai Optics", glyph: "KSO" },
  { name: "Vanguard Audio", glyph: "VGD" },
  { name: "Solstice AI", glyph: "SLS" },
  { name: " Polestar Lab", glyph: "PLS" },
  { name: "Atelier Zero", glyph: "AT0" },
  { name: "Helios Robotics", glyph: "HLS" },
  { name: "Forma Spatial", glyph: "FRM" },
];

export const AWARDS_LEDGER = [
  {
    jury: "Awwwards",
    items: [
      { count: "002", title: "Independent Studio of the Year Nominee" },
      { count: "003", title: "Site of the Month" },
      { count: "014", title: "Site of the Day" },
      { count: "011", title: "Developer Award" },
    ],
  },
  {
    jury: "The FWA",
    items: [
      { count: "002", title: "FWA of the Month" },
      { count: "016", title: "FWA of the Day" },
    ],
  },
  {
    jury: "Webby & D&AD",
    items: [
      { count: "003", title: "Webby Winner — Best Visual & Technical" },
      { count: "002", title: "D&AD Wood Pencil — Digital Design" },
      { count: "004", title: "CSSDA Best Innovation & UI/UX" },
    ],
  },
  {
    jury: "Global Craft",
    items: [
      { count: "003", title: "Lovie Gold — XR & Interactive" },
      { count: "004", title: "Communication Arts Interactive Annual" },
    ],
  },
];

export const TALKS_LIST = [
  { event: "Digital Design Days", location: "Milan, IT", date: "Oct 2026", topic: "Zero-Allocation WebGL & Optical Shaders" },
  { event: "Awwwards Conference", location: "Amsterdam, NL", date: "May 2026", topic: "Choreographing DOM & GPU Without Layout Thrash" },
  { event: "OFFF Festival", location: "Barcelona, ES", date: "Apr 2025", topic: "Satire, Craft & Real-Time Product Worlds" },
  { event: "KIKK Festival", location: "Namur, BE", date: "Oct 2025", topic: "Procedural Sound & Tactile Web Interfaces" },
  { event: "Kyoto Media Arts", location: "Kyoto, JP", date: "Nov 2024", topic: "Sub-Megabyte Cinema on Mobile GPUs" },
];
