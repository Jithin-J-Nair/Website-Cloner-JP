#!/usr/bin/env node
/** Reproducible local-baseline comparisons; these are NOT reference-site comparisons. */
import fs from 'node:fs';
import sharp from 'sharp';
const root = 'temp/master';
const background = '#080808';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const label = (text, width, height = 30) => Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${background}"/><text x="8" y="21" fill="white" font-family="sans-serif" font-size="14">${escape(text)}</text></svg>`);
for (const width of [1440, 768, 390]) {
  const report = JSON.parse(fs.readFileSync(`${root}/after/${width}.json`, 'utf8'));
  const cell = width === 390 ? 260 : 420, gap = 12;
  const shotHeight = Math.round(report.height * cell / width), tileHeight = shotHeight + 30;
  const names = report.shots.map(s => s.file);
  const sheetWidth = cell * 3 + gap * 4;
  const layers = [{ input: label(`FINAL BUILD / ${width} x ${report.height} / local implementation`, sheetWidth, 38), left: 0, top: 0 }];
  for (let i = 0; i < names.length; i++) {
    const left = gap + (i % 3) * (cell + gap), top = 44 + Math.floor(i / 3) * (tileHeight + gap);
    layers.push({ input: label(names[i], cell), left, top });
    layers.push({ input: await sharp(`${root}/after/${names[i]}`).resize(cell, shotHeight).toBuffer(), left, top: top + 30 });
  }
  await sharp({ create: { width: sheetWidth, height: 44 + Math.ceil(names.length / 3) * (tileHeight + gap), channels: 3, background } }).composite(layers).jpeg({ quality: 84 }).toFile(`${root}/after/sheet-${width}.jpg`);
  const thumb = width === 390 ? 390 : 640, pageWidth = thumb * 2 + gap * 3;
  const pairs = [
    ['AWARDS', `${width}-about-award.jpg`, `${width}-about-award.jpg`],
    ['EXPERTISE', `${width}-about-capability.jpg`, `${width}-about-capability.jpg`],
    ['CONTACT', `${width}-end-section.jpg`, `${width}-cta-12-p1.jpg`],
  ];
  const rowHeight = Math.round(report.height * thumb / width), pairLayers = [
    { input: label(`BEFORE - local baseline / ${width}`, thumb, 38), left: gap, top: 0 },
    { input: label('AFTER - final build (not live reference)', thumb, 38), left: thumb + gap * 2, top: 0 },
  ];
  for (let i = 0; i < pairs.length; i++) {
    const [name, before, after] = pairs[i], top = 42 + i * (rowHeight + 34 + gap);
    for (const [column, path] of [[0, `${root}/before/${before}`], [1, `${root}/after/${after}`]]) {
      const left = gap + column * (thumb + gap);
      pairLayers.push({ input: label(name, thumb), left, top });
      pairLayers.push({ input: await sharp(path).resize(thumb, rowHeight).toBuffer(), left, top: top + 30 });
    }
  }
  await sharp({ create: { width: pageWidth, height: 42 + pairs.length * (rowHeight + 34 + gap), channels: 3, background } }).composite(pairLayers).jpeg({ quality: 85 }).toFile(`${root}/after/comparison-${width}.jpg`);
}
console.log('Built final contact sheets and explicitly labeled local-before/after comparisons.');
