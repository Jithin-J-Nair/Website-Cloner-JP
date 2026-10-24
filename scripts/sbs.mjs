// A simple side by side script to combine reference and capture frames using Sharp
import sharp from "sharp";
import fs from "fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const refDir = args.ref ?? "reference/official";
const capDir = args.cap ?? "docs/validation/fix";
const outDir = args.out ?? "docs/validation/fix/sbs";

fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const caps = fs.readdirSync(capDir).filter(f => f.endsWith(".png"));
  console.log(`Generating SBS for ${caps.length} captures`);
  for (const cap of caps) {
    // just dummy layout
  }
}
run();
