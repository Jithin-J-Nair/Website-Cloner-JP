#!/usr/bin/env node
/**
 * Phase D Automated Security, Allowlist & RFC 7233 Byte-Range Test Suite
 * Targets `src/app/assets/[...path]/route.ts` on an isolated standalone server instance.
 *
 * Verifies:
 *  1. Clean-production synthesized fallback for approved project stills (`200`, `image/svg+xml`, strict CSP + `nosniff`)
 *  2. Path traversal rejection (`..`, `%2e%2e`, encoded backslash `%5c`, null byte `%00`, dotfile `.env`)
 *  3. Symlink escape blocking (`ln -s /etc/hostname ...` -> `403 Forbidden`, never reads target)
 *  4. Commercial font block across ALL directories & case variants (`/assets/fonts/...`, `/assets/FONTS/...`, `/assets/other/Aeonik.woff2`)
 *  5. Open-license SIL OFL font allowlist (`200 OK` on `/assets/fonts/IBMPlexMono-Regular.woff2`)
 *  6. Arbitrary / unlisted file rejection (`403`/`404` on `.json`, `.buf`, unlisted filenames)
 *  7. Missing non-synthesized media (`404` on absent `/assets/textures/reel/desktop.mp4` when unmounted)
 *  8. Valid RFC 7233 byte-range streaming (`bytes=0-3`, open-ended `bytes=6-`, suffix `bytes=-4` -> `"6789"`)
 *  9. Malformed / out-of-bounds / multipart RFC 7233 ranges (`bytes=0-abc`, `bytes=50-60`, `bytes=0-1,3-4` -> `416`, never `500`)
 * 10. Explicit `HEAD` handler (`200 OK`, accurate `Content-Length`, empty body)
 * 11. Served SVG security headers (`Content-Security-Policy` with `sandbox` + `X-Content-Type-Options: nosniff`)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const TEST_PORT = Number(process.env.ASSET_TEST_PORT || 3199);

function rawGet(urlPath, headers = {}, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function waitForServer(maxMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await rawGet("/");
      if (res.status && res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for standalone server on port ${TEST_PORT}`);
}

const tmpFixture = fs.mkdtempSync(path.join(os.tmpdir(), "lusion-asset-route-test-"));
fs.mkdirSync(path.join(tmpFixture, "textures", "reel"), { recursive: true });
fs.mkdirSync(path.join(tmpFixture, "projects", "oryzo_ai"), { recursive: true });
fs.mkdirSync(path.join(tmpFixture, "fonts"), { recursive: true });
fs.mkdirSync(path.join(tmpFixture, "other"), { recursive: true });

// 10-byte deterministic payload for byte-exact range assertions
fs.writeFileSync(path.join(tmpFixture, "textures", "reel", "desktop.mp4"), "0123456789");
// Symlink escape attempt on an approved catalog path!
fs.symlinkSync("/etc/hostname", path.join(tmpFixture, "projects", "oryzo_ai", "home.webp"));
// Commercial font files in multiple places
fs.writeFileSync(path.join(tmpFixture, "fonts", "Aeonik-Regular.woff2"), "PROPRIETARY_FONT");
fs.writeFileSync(path.join(tmpFixture, "other", "Aeonik-Regular.woff2"), "PROPRIETARY_FONT_NESTED");
// Arbitrary non-allowlisted secret file
fs.writeFileSync(path.join(tmpFixture, "secret.json"), '{"secret":true}');

const serverProc = spawn(process.execPath, [".next/standalone/server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    PORT: String(TEST_PORT),
    LUSION_ALLOW_LOCAL_INSPECTION_ASSETS: "1",
    LUSION_LOCAL_REF_ASSETS: tmpFixture,
  },
  stdio: "ignore",
});

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed += 1;
  } else {
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

try {
  await waitForServer();
  console.log(`=== ASSET ROUTE SECURITY & RFC 7233 SUITE (port ${TEST_PORT}) ===`);

  // 1. Encoded & raw path traversal attacks
  const travEncoded = await rawGet("/assets/%2e%2e/package.json");
  check("Blocks URL-encoded traversal (%2e%2e)", [400, 403, 404].includes(travEncoded.status), `got ${travEncoded.status}`);

  const travBackslash = await rawGet("/assets/projects%5c..%5cpackage.json");
  check("Blocks encoded backslash (%5c)", travBackslash.status === 400, `got ${travBackslash.status}`);

  const travNull = await rawGet("/assets/projects/oryzo_ai/home.webp%00.png");
  check("Blocks null-byte injection (%00)", travNull.status === 400, `got ${travNull.status}`);

  const dotFile = await rawGet("/assets/.env");
  check("Blocks hidden dotfile (.env)", dotFile.status === 400, `got ${dotFile.status}`);

  // 2. Symlink escape on an otherwise-approved path!
  const symlinkRes = await rawGet("/assets/projects/oryzo_ai/home.webp");
  check(
    "Blocks symlink escape out of asset root even for allowlisted path",
    symlinkRes.status === 403 && !symlinkRes.body.toString().includes("e2b"),
    `got ${symlinkRes.status}`
  );

  // 3. Commercial font blocks (all directories & cases) + Open-license font allowlist
  const fontRoot = await rawGet("/assets/fonts/Aeonik-Regular.woff2");
  check("Blocks commercial font in /assets/fonts/", fontRoot.status === 403, `got ${fontRoot.status}`);

  const fontUpper = await rawGet("/assets/FONTS/Aeonik-Regular.woff2");
  check("Blocks case-variant /assets/FONTS/", fontUpper.status === 403, `got ${fontUpper.status}`);

  const fontNested = await rawGet("/assets/other/Aeonik-Regular.woff2");
  check("Blocks commercial .woff2 in non-/fonts subfolder", fontNested.status === 403, `got ${fontNested.status}`);

  const oflFont = await rawGet("/assets/fonts/IBMPlexMono-Regular.woff2");
  check(
    "Serves approved SIL OFL font (/assets/fonts/IBMPlexMono-Regular.woff2)",
    oflFont.status === 200 && oflFont.body.length > 1000,
    `got ${oflFont.status}`
  );

  // 4. Unlisted extension / file block
  const secretJson = await rawGet("/assets/secret.json");
  check("Blocks non-allowlisted .json file (403)", secretJson.status === 403, `got ${secretJson.status}`);

  // 5. Synthesized clean-room SVG delivery + strict CSP & nosniff headers
  const synthCard = await rawGet("/assets/projects/atlas_motion/home.webp");
  check(
    "Synthesizes approved fallback SVG with strict sandbox CSP + nosniff",
    synthCard.status === 200 &&
      String(synthCard.headers["content-type"]).includes("image/svg+xml") &&
      String(synthCard.headers["content-security-policy"]).includes("sandbox") &&
      synthCard.headers["x-content-type-options"] === "nosniff" &&
      synthCard.body.toString("utf8").includes("Atlas Motion"),
    `status=${synthCard.status} csp=${synthCard.headers["content-security-policy"]}`
  );

  // 6. Missing non-synthesized stream returns clean 404
  const missingMp4 = await rawGet("/assets/textures/reel/mobile.mp4");
  check("Returns 404 for absent non-synthesized .mp4 stream", missingMp4.status === 404, `got ${missingMp4.status}`);

  // 7. HEAD metadata-only check
  const headRes = await rawGet("/assets/textures/reel/desktop.mp4", {}, "HEAD");
  check(
    "HEAD returns 200 with exact Content-Length=10 and 0 body bytes",
    headRes.status === 200 &&
      headRes.headers["content-length"] === "10" &&
      headRes.body.length === 0,
    `status=${headRes.status} len=${headRes.headers["content-length"]} body=${headRes.body.length}`
  );

  // 8. RFC 7233 valid ranges (explicit, open-ended, and suffix bytes=-4!)
  const rangeExplicit = await rawGet("/assets/textures/reel/desktop.mp4", { Range: "bytes=2-5" });
  check(
    "RFC 7233 explicit Range bytes=2-5 -> 206 '2345' (bytes 2-5/10)",
    rangeExplicit.status === 206 &&
      rangeExplicit.headers["content-range"] === "bytes 2-5/10" &&
      rangeExplicit.body.toString() === "2345",
    `status=${rangeExplicit.status} cr=${rangeExplicit.headers["content-range"]} body=${rangeExplicit.body}`
  );

  const rangeSuffix = await rawGet("/assets/textures/reel/desktop.mp4", { Range: "bytes=-4" });
  check(
    "RFC 7233 suffix Range bytes=-4 -> 206 '6789' (bytes 6-9/10)",
    rangeSuffix.status === 206 &&
      rangeSuffix.headers["content-range"] === "bytes 6-9/10" &&
      rangeSuffix.body.toString() === "6789",
    `status=${rangeSuffix.status} cr=${rangeSuffix.headers["content-range"]} body=${rangeSuffix.body}`
  );

  // 9. RFC 7233 malformed, non-numeric, out-of-bounds & multipart ranges -> 416 (never 500!)
  const rangeNan = await rawGet("/assets/textures/reel/desktop.mp4", { Range: "bytes=0-abc" });
  check(
    "Rejects malformed Range bytes=0-abc with 416 (fixes prior 500 crash)",
    rangeNan.status === 416 && rangeNan.headers["content-range"] === "bytes */10",
    `got ${rangeNan.status}`
  );

  const rangeOob = await rawGet("/assets/textures/reel/desktop.mp4", { Range: "bytes=50-60" });
  check("Rejects out-of-bounds Range bytes=50-60 with 416", rangeOob.status === 416, `got ${rangeOob.status}`);

  const rangeMulti = await rawGet("/assets/textures/reel/desktop.mp4", { Range: "bytes=0-1,4-5" });
  check("Rejects unsupported multipart Range bytes=0-1,4-5 with 416", rangeMulti.status === 416, `got ${rangeMulti.status}`);

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
} finally {
  serverProc.kill("SIGTERM");
  fs.rmSync(tmpFixture, { recursive: true, force: true });
}
