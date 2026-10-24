# Lusion fidelity recovery — execution decisions and blockers

## Branch decision
The request names both `arena/a1fc87a1-website-cloner-jp` and, in Step 0 and the authoritative companion prompt, `arena/c8775c5f-website-cloner-jp`. The latter is the selected working branch because the setup step, launch prompt, and master prompt all explicitly designate it. The branch was verified to contain the earlier `arena/abde912a-website-cloner-jp` work as its ancestor (three commits ahead, zero behind at inspection time). No reset or destructive branch operation was performed.

## Reference and source-file status
- The accessible Library contains `ARENA_LAUNCH_PROMPT.md`, `00_MASTER_PROMPT.md`, and `01_CODE_LIBRARY.md`; those exact contents were copied into this directory.
- `02_ADDENDUM_V2.md` was not present in the accessible conversation or Library files and does not exist at the requested repository path on the selected branch. It has **not** been fabricated or replaced with inferred content.
- `reference/TIMELINE_OFFICIAL.md` was not present on the selected branch.
- The Google Drive connector is not available in this execution environment, so the supplied Drive folder could not be enumerated or downloaded. No substitute website, old capture, or guessed image is being represented as official reference evidence.
- Consequently, every visual-fidelity statement remains **UNVERIFIED against reference** until the exact official/current frames and Addendum are available in the workspace.

## Verified repository facts
- `package.json` declares Next.js 16.3.5, Three.js ^0.186.1, React 19.2.4, React Three Fiber ^9.8.2, `postprocessing` ^6.39.5, `playwright-core` ^1.64.1 and `@sparticuz/chromium` ^153.0.0.
- `scripts/phase-c-home-validate.mjs` already imports `playwright-core` and `@sparticuz/chromium`; the added sequence harness uses those declared dependencies rather than introducing another browser package.
- Source-level inspection is not visual verification. No build, browser capture, hardware-rendering measurement, or image comparison was executed from this environment.

## Commits
Documentation was added through the connected GitHub file API, which creates one commit per file rather than one multi-file commit:
- `ccabe51788b7a23b3da5830f9a6ec203a0e37b11` — `docs/lusion-fix/ARENA_LAUNCH_PROMPT.md`
- `e0d47cc0cd9643e73110d488b8f0672ac4957614` — `docs/lusion-fix/00_MASTER_PROMPT.md`
- `ed4cda488e3ad3f4dccab645dabcf280fd144971` — `docs/lusion-fix/01_CODE_LIBRARY.md`

## Decisions
1. Preserve the selected branch and its existing hero/tablet work.
2. Do not fetch `lusion.co`.
3. Do not invent official screenshots, scene timestamps, skill rules, API support, or visual-pass claims.
4. Use the repository's installed Playwright/Chromium dependencies for capture automation.
