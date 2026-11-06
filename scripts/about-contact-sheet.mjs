#!/usr/bin/env node
/**
 * Side-by-side About screenshot contact sheet.
 * Reference frames are optional and are only read from the user-supplied
 * reference/about directory. When missing, the right panel is explicitly marked
 * UNVERIFIED; no external/reference site is fetched.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const captureDir = path.resolve(process.env.ABOUT_CAPTURE_OUT || "/tmp/about-shots");
const referenceDir = path.resolve(process.env.ABOUT_REFERENCE_DIR || "reference/about");
const output = path.resolve(process.env.ABOUT_CONTACT_SHEET_OUT || "/tmp/about-contact-sheet.png");
const manifestPath = path.join(captureDir, "manifest.json");
if (!fs.existsSync(manifestPath)) throw new Error(`Missing capture manifest: ${manifestPath}. Run scripts/about-capture.mjs first.`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entries = fs.existsSync(referenceDir)
  ? fs.readdirSync(referenceDir, { withFileTypes: true })
      .filter(entry => entry.isFile() && /^ref_\d{3}\.png$/i.test(entry.name))
      .map(entry => {
        const match = entry.name.match(/(\d+)/);
        return { name: entry.name, seconds: Number(match?.[1] ?? 1) - 1, path: path.join(referenceDir, entry.name) };
      })
  : [];
const width = 1280, panelWidth = 624, imageHeight = 390, labelHeight = 44, gap = 32, rowHeight = imageHeight + labelHeight + 28;
const height = rowHeight * manifest.captures.length + 32;
const composites = [];
const svgLabel = (text, w = panelWidth) => Buffer.from(
  `<svg width="${w}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#17171c"/><text x="12" y="28" fill="#f4f4f5" font-family="Arial,sans-serif" font-size="15">${String(text).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]))}</text></svg>`
);
const placeholder = (label) => sharp(Buffer.from(
  `<svg width="${panelWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0d0c0f"/><path d="M28 28H596V362H28Z" stroke="#4b4b54" stroke-dasharray="5 7" fill="none"/><text x="50%" y="48%" text-anchor="middle" fill="#f8fafc" font-family="Arial,sans-serif" font-size="22">${label}</text><text x="50%" y="56%" text-anchor="middle" fill="#a1a1aa" font-family="Arial,sans-serif" font-size="14">Reference frames not supplied</text></svg>`
)).png().toBuffer();

for (let i = 0; i < manifest.captures.length; i++) {
  const capture = manifest.captures[i];
  const shotPath = path.join(captureDir, capture.screenshot);
  if (!fs.existsSync(shotPath)) throw new Error(`Missing screenshot: ${shotPath}`);
  const second = capture.referenceSeconds ?? capture.fraction * 38;
  const nearest = entries.length ? entries.reduce((best, item) => Math.abs(item.seconds - second) < Math.abs(best.seconds - second) ? item : best) : null;
  const left = await sharp(shotPath).resize(panelWidth, imageHeight, { fit: "cover", position: "centre" }).png().toBuffer();
  const right = nearest
    ? await sharp(nearest.path).resize(panelWidth, imageHeight, { fit: "cover", position: "centre" }).png().toBuffer()
    : await placeholder("UNVERIFIED");
  const y = 16 + i * rowHeight;
  composites.push({ input: await svgLabel(`OURS  ·  ${capture.phase}  ·  scroll ${Math.round(capture.fraction * 100)}%`), left: 0, top: y });
  composites.push({ input: left, left: 0, top: y + labelHeight });
  composites.push({ input: await svgLabel(nearest ? `REFERENCE  ·  ${nearest.name}  ·  ~${nearest.seconds}s` : "REFERENCE  ·  UNVERIFIED — no reference/about frames in repository"), left: panelWidth + gap, top: y });
  composites.push({ input: right, left: panelWidth + gap, top: y + labelHeight });
}
await sharp({
  create: { width, height, channels: 4, background: "#0d0c0f" },
}).composite(composites).png().toFile(output);
console.log(`Wrote ${manifest.captures.length} paired rows to ${output}`);
console.log(entries.length ? `Matched against ${entries.length} supplied reference frames.` : "UNVERIFIED: no user-supplied reference/about/ref_###.png frames were found. No reference was fetched.");
