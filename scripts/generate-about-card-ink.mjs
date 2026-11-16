#!/usr/bin/env node
/** Original symmetric vector engraving for the About deck. No captured artwork
 * or bundled reference image is read by this reproducible build step. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const output = 'public/assets/images/cards/back-ink.svg';
const rays = Array.from({length: 13}, (_, i) => {
  const d = 10 + i * 13;
  return `<path d="M${90+d} 128L${90+d} ${246-d*.35}L${260-d*.22} 368"/>`;
}).join('');
const corner = `<path d="M48 138Q138 138 138 48M58 172Q172 172 172 58M48 48H172L48 172ZM76 48V172M48 76H172"/>
  <circle cx="48" cy="48" r="8"/><path d="M192 54V128M184 66H200M184 108H200"/>
  <circle cx="192" cy="86" r="12"/>`;
const half = `<path d="M104 188H524V350L470 410M104 188V350L158 410M104 188L280 366M524 188L348 366"/>
  <g>${rays}<g transform="translate(628 0) scale(-1 1)">${rays}</g></g>
  <path d="M314 52V148M292 76A22 22 0 1 0 336 76A22 22 0 1 0 292 76M302 130A12 12 0 1 0 326 130A12 12 0 1 0 302 130"/>
  <path d="M314 164C244 230 242 268 256 292M314 164C384 230 386 268 372 292"/>
  <path d="M64 220V374L118 438L64 502V656M564 220V374L510 438L564 502V656"/>
  <circle cx="64" cy="252" r="5"/><circle cx="64" cy="284" r="5"/>
  <circle cx="564" cy="252" r="5"/><circle cx="564" cy="284" r="5"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="628" height="876" viewBox="0 0 628 876" fill="none">
<title>Symmetric studio playing-card engraving</title>
<g stroke="white" stroke-width="2.2" stroke-linejoin="round">
<rect x="14" y="14" width="600" height="848" rx="22" stroke-width="5"/>
<rect x="34" y="34" width="560" height="808" rx="10"/>
${corner}<g transform="translate(628 0) scale(-1 1)">${corner}</g>
<g transform="translate(0 876) scale(1 -1)">${corner}<g transform="translate(628 0) scale(-1 1)">${corner}</g></g>
${half}<g transform="translate(0 876) scale(1 -1)">${half}</g>
<path d="M314 300C334 300 342 318 358 330L420 394Q458 438 420 482L358 546Q314 584 270 546L208 482Q170 438 208 394L270 330C286 318 294 300 314 300Z" fill="#3733e8"/>
<circle cx="314" cy="438" r="78"/><circle cx="314" cy="322" r="3" fill="white"/><circle cx="314" cy="554" r="3" fill="white"/>
<circle cx="198" cy="438" r="3" fill="white"/><circle cx="430" cy="438" r="3" fill="white"/>
</g><path fill="white" d="M285 399H306V454H285ZM310 458H352V477H310Z"/>
</svg>`;
fs.mkdirSync('public/assets/images/cards', { recursive: true });
fs.writeFileSync(output, svg);
console.log(JSON.stringify({output,sha256:createHash('sha256').update(svg).digest('hex'),width:628,height:876,origin:'original symmetric SVG'}));
