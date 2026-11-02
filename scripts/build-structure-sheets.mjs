#!/usr/bin/env node
import fs from 'node:fs';
import sharp from 'sharp';
const root = 'temp/structures';
const label = (text, width, height = 30) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#080808"/><text x="8" y="21" font-family="sans-serif" font-size="13" fill="white">${text}</text></svg>`);
for (const width of [1440, 768, 390]) {
  const report = JSON.parse(fs.readFileSync(`${root}/after/${width}.json`, 'utf8'));
  const cell = width === 390 ? 250 : 420, gap = 12;
  const h = Math.round(report.height * cell / width), tile = h + 30;
  const w = cell * 3 + gap * 4, height = 42 + Math.ceil(report.shots.length / 3) * (tile + gap);
  const layers = [{ input: label(`FINAL / ${width} x ${report.height} / cinematic structures and live 3D expertise`, w, 36), top: 0, left: 0 }];
  for (let i = 0; i < report.shots.length; i++) {
    const file = report.shots[i], left = gap + i % 3 * (cell + gap), top = 42 + Math.floor(i / 3) * (tile + gap);
    layers.push({ input: label(file, cell), left, top });
    layers.push({ input: await sharp(`${root}/after/${file}`).resize(cell, h).toBuffer(), left, top: top + 30 });
  }
  await sharp({ create: { width: w, height, channels: 3, background: '#080808' } }).composite(layers).jpeg({ quality: 85 }).toFile(`${root}/after/sheet-${width}.jpg`);
  const pairWidth = cell * 2 + gap * 3;
  const pairs = [{ input: label('LOCAL BEFORE (1e59091)', cell, 36), left: gap, top: 0 }, { input: label('LOCAL AFTER (not live-reference parity)', cell, 36), left: cell + gap * 2, top: 0 }];
  for (let i = 0; i < 2; i++) for (const [column, folder] of [[0, 'before'], [1, 'after']]) {
    const file = `${width}-u${i === 0 ? 0 : 1.6}.jpg`, left = gap + column * (cell + gap), top = 42 + i * (tile + gap);
    pairs.push({ input: label(i === 0 ? 'OPENING VOLUME' : 'VALLEY / EXPLORER / PLUME', cell), left, top });
    pairs.push({ input: await sharp(`${root}/${folder}/${file}`).resize(cell, h).toBuffer(), left, top: top + 30 });
  }
  await sharp({ create: { width: pairWidth, height: 42 + 2 * (tile + gap), channels: 3, background: '#080808' } }).composite(pairs).jpeg({ quality: 85 }).toFile(`${root}/after/comparison-${width}.jpg`);
}
console.log('Built three final structure contact sheets and clearly labeled local-before/after comparisons.');
