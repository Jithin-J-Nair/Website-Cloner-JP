// Compare same-named reference and running-build images; missing pairs are errors.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const refDir = args.ref ?? "reference/official";
const capDir = args.cap ?? "docs/validation/fix";
const outDir = args.out ?? "docs/validation/fix/sbs";

async function run() {
  const captures = fs.readdirSync(capDir).filter(f => /\.(png|jpe?g)$/i.test(f));
  if (!captures.length) throw new Error(`No captures in ${capDir}`);
  const pairs = captures.map(file => {
    const reference = path.join(refDir, file);
    if (!fs.existsSync(reference)) throw new Error(`Missing same-named reference: ${reference}`);
    return { file, reference, capture: path.join(capDir, file) };
  });
  fs.mkdirSync(outDir, { recursive: true });
  for (const { file, reference, capture } of pairs) {
    const metadata = await sharp(reference).metadata();
    if (!metadata.width || !metadata.height) throw new Error(`Invalid reference image: ${reference}`);
    const { width, height } = metadata;
    const left = await sharp(reference).resize(width, height).png().toBuffer();
    // Contain, not crop/distort: a viewport mismatch remains visible as letterboxing.
    const right = await sharp(capture).resize(width, height, { fit: "contain", background: "#000" }).png().toBuffer();
    await sharp({ create: { width: width * 2, height, channels: 3, background: "#000" } })
      .composite([{ input: left, left: 0, top: 0 }, { input: right, left: width, top: 0 }])
      .png().toFile(path.join(outDir, `${path.parse(file).name}.png`));
  }
  console.log(`Compared ${pairs.length} pairs; reference left, running build right. No parity score inferred.`);
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
