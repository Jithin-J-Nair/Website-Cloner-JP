#!/usr/bin/env node
/** Exercise the actual manifest-guarded route; no inspection bypass/fixture root. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
const base = process.env.BASE_URL || 'http://127.0.0.1:3003';
for (const name of ['matcap', 'matcap_ld']) {
  const url = `${base}/assets/textures/home/${name}.exr`;
  const bytes = fs.readFileSync(`media-bundle/textures/home/${name}.exr`);
  const res = await fetch(url); assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/octet-stream');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('content-security-policy').includes('sandbox'));
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), bytes);
  assert.equal(bytes.readUInt32LE(), 20000630, 'OpenEXR magic');
  const range = await fetch(url, {headers: {Range: 'bytes=0-31'}});
  assert.equal(range.status, 206); assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 32));
  const invalid = await fetch(url, {headers: {Range: `bytes=${bytes.length}-`}});
  assert.equal(invalid.status, 416);
}
const requestRaw = rawPath => new Promise((resolve, reject) => {
  const url = new URL(base); const transport = url.protocol === 'https:' ? https : http;
  const req = transport.get({hostname: url.hostname, port: url.port, path: rawPath}, res => {res.resume(); res.on('end', () => resolve(res.statusCode));});
  req.on('error', reject);
});
for (const [path, statuses] of [
  ['/assets/textures/home/not-in-manifest.exr', [404]],
  ['/assets/fonts/Aeonik-Regular.woff2', [403]],
  ['/assets/other/Aeonik-Regular.woff2', [403]],
  ['/assets/FONTS/Aeonik-Regular.woff2', [403]],
  ['/assets/textures/home/matcap.exr%00.png', [400]],
  ['/assets/textures%5chome%5cmatcap.exr', [400]],
  ['/assets/textures/home/%2e%2e/%2e%2e/package.json', [400,403,404]],
  ['/assets/.env', [400]],
  ['/assets/secret.json', [403]],
]) assert.ok(statuses.includes(await requestRaw(path)), path);
console.log('PASS HDR assets: exact manifest bytes, EXR magic, binary MIME, security headers, ranges, unlisted paths, traversal and commercial-font blocks.');
