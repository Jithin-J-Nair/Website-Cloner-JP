#!/usr/bin/env node
/** Encode timestamped CDP frames without inventing a constant capture frame rate.
 * Usage: FFMPEG_EXECUTABLE_PATH=/path/to/ffmpeg node scripts/encode-browser-recording.mjs input-dir output.mp4
 * Accepts recording.json from the clock probe or report.json from the extended audit.
 * ffmpeg is an optional external evidence tool, not an application dependency.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [input, output] = process.argv.slice(2);
assert.ok(input && output, 'Usage: encode-browser-recording.mjs input-dir output.mp4');
const dir = path.resolve(input);
const metadata = path.join(dir, fs.existsSync(path.join(dir, 'recording.json')) ? 'recording.json' : 'report.json');
const { frames } = JSON.parse(fs.readFileSync(metadata, 'utf8'));
assert.ok(frames.length > 1, 'At least two timestamped CDP frames required');
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const lines = ['ffconcat version 1.0'];
for (let i = 0; i < frames.length; i++) {
  assert.ok(Number.isFinite(frames[i].time));
  if (i) assert.ok(frames[i].time >= frames[i - 1].time, 'Capture timestamps must be monotonic');
  lines.push(`file ${quote(path.join(dir, frames[i].file))}`);
  if (i < frames.length - 1) lines.push(`duration ${Math.max(0.001, frames[i + 1].time - frames[i].time).toFixed(6)}`);
}
lines.push(`file ${quote(path.join(dir, frames.at(-1).file))}`);
const concat = path.join(dir, 'recording.ffconcat');
fs.writeFileSync(concat, lines.join('\n') + '\n');
const target = path.resolve(output);
fs.mkdirSync(path.dirname(target), { recursive: true });
execFileSync(process.env.FFMPEG_EXECUTABLE_PATH || 'ffmpeg', [
  '-hide_banner', '-loglevel', 'warning', '-y', '-safe', '0', '-f', 'concat', '-i', concat,
  '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-fps_mode', 'vfr',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target,
], { stdio: 'inherit' });
console.log(JSON.stringify({ target, capturedFrames: frames.length, captureSpanSeconds: frames.at(-1).time - frames[0].time }));
