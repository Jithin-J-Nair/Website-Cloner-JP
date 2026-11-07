#!/usr/bin/env node
/** Retain the verified card's linework; remove only its baked blue background
 * so existing route-owned blue/perspective/flip styling remains authoritative. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const source = 'media-bundle/images/cards/back.png';
const output = 'public/assets/images/cards/back-ink.png';
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const ink = Math.max(0, Math.min(1, (Math.min(data[i], data[i + 1]) - 34) / 221));
  data[i + 3] = Math.round(data[i + 3] * ink);
  data[i] = data[i + 1] = data[i + 2] = 255;
}
fs.mkdirSync('public/assets/images/cards', { recursive: true });
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(output);
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
console.log(JSON.stringify({ source, sourceSha256: hash(source), output, outputSha256: hash(output), width: info.width, height: info.height,
  treatment: 'Original raster linework, white ink alpha from minimum red/green above baked-blue channel level 34; no redrawing or new ornament.' }, null, 2));
