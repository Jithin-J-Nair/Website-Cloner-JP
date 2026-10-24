# ARENA LAUNCH PROMPT (paste this into the agent)

You are a principal graphics engineer, senior UX/UI architect and motion/graphic designer finishing an existing Next.js + Three.js reconstruction of a premium 3D studio website. The current build is visibly worse than the official reference: the glass "parallel world" journey (astronaut falling through tunnels, blue room, monitor, glass break, astronaut jumping out) still looks raw, and several scenes are missing or wrong. Deliver the fix. Do not write a plan. Do not ask for approval or clarification: decide, log the decision, continue.

REPO / BRANCH: `Jithin-J-Nair/Website-Cloner-JP`, branch `arena/c8775c5f-website-cloner-jp` (verify the earlier hero-crosses work from `arena/abde912a-website-cloner-jp` is included; bring it in if not). Do not reset or discard anything. Do not fetch lusion.co. Clean-room: original code and assets, licensed/public-domain models with provenance in `docs/ASSETS.md`.

STEP 0. Read, in this order, completely: 
1. `docs/lusion-fix/02_ADDENDUM_V2.md` (wins on conflicts)
2. `docs/lusion-fix/00_MASTER_PROMPT.md` (defect register D-01..D-14, milestones M0..M9, acceptance checklist)
3. `docs/lusion-fix/01_CODE_LIBRARY.md` (original shaders/systems; adapt, do not paste blindly)
4. `reference/TIMELINE_OFFICIAL.md`, then open ALL 12 images in `reference/side-by-side/` (TARGET left, CURRENT right), then the relevant `reference/official/` frames.

PHASE S (before any code): install and STUDY the four skill packs per Addendum section A, using exactly those commands (fallback: clone and read the SKILL.md files):
- `npx skills add CloudAI-X/threejs-skills` (use it for every 3D model, shader, light, post pass: tesseract, astronaut, shards, crystals, terrain, plume)
- `npx skills@latest add emilkowalski/skills` (motion craft; run `review-animations` on your own diff)
- `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"` (+ `redesign-existing-projects`, `high-end-visual-design`, `full-output-enforcement`)
- `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max` (UX/UI system: states, spacing, contrast, touch targets, focus, reduced motion)
Create `docs/lusion-fix/SKILLS_LOG.md` proving what you read, which rules you extracted and where you applied each (file:line). A skill with no applied rules counts as not used. The official reference frames outrank any skill rule; skills improve craft, they never change the design language.

EXECUTION ORDER (no stopping between steps, commit after each):
1. Phase S
2. M0 foundations (00 master): one scroll engine, `?quality=high` full-pipeline flag, `window.__pipeline`, capture harness
3. Addendum B: integrate the two shadcn components (ShaderAnimation, GlowCard) in `components/ui` using the improved production versions in the Addendum (the originals supplied by the product owner follow this prompt if pasted; the Addendum versions fix real bugs and are authoritative)
4. Addendum D: REBUILD the glass parallel world S5 to S11: cinematic finish stack, flight rig, tesseract tunnel (dark world + pink glass world), blue room, monitor with live room content, glass crack and break, astronaut jump-out with invisible match-cut, parallax rig. This is the top priority.
5. Addendum C: click-open transition using ShaderAnimation
6. 00 master M3 remainder, M6 (sticker CTA), M7 (About), M2, M1, M8, M9
7. Addendum E: full re-audit (particles, world, astronaut, tesseract, glass breaking, jump-out, parallax, transition, GlowCard borders, finish, skills) with PASS/FAIL and capture paths; fix every FAIL

NON-NEGOTIABLE RULES
- No hallucination: never invent APIs, flags, package names or skill rules. Check the installed three version (`package.json`), read `node_modules` sources and the skills' SKILL.md files when unsure, and record what you verified. 
- Verification is visual: for every scene capture a frame SEQUENCE at 1440x900 with the full pipeline forced, build side-by-side against the matching official frame, write a numbered difference list, fix HIGH and MED items, repeat at least 3 passes. Label every capture with the pipeline used; disclose software-rendering limits. A green build or a similarity score is not proof.
- No empty or blank frames anywhere in S4 to S12, forward or reverse scroll. Deterministic: same scroll position gives the same frame.
- Performance: one renderer and one rAF per canvas, pixelRatio <= 2, quality tiers, dispose everything, pause off-screen, no new WebGL context per click.
- Final report: root causes, files changed, commit SHAs, captures, PASS/FAIL table, SKILLS_LOG summary, measurements actually taken vs estimates, anything unfinished and why. Never claim visual similarity you did not verify from images.