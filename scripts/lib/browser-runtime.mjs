import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
const require = createRequire(import.meta.url);

/** Existing Chromium/SwiftShader setup, shared only by the new repair probes. */
export async function launchMotionBrowser() {
  // Same bundled Chromium/SwiftShader support as capture-astronaut-emergence.mjs.
  const libDir = path.join(os.tmpdir(), 'goal-chromium-libs');
  fs.mkdirSync(libDir, { recursive: true });
  const binDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..', 'bin');
  for (const archive of ['al2023', 'swiftshader']) {
    const marker = path.join(libDir, `.${archive}`);
    if (!fs.existsSync(marker)) {
      const tar = path.join(libDir, `${archive}.tar`);
      fs.writeFileSync(tar, zlib.brotliDecompressSync(fs.readFileSync(path.join(binDir, `${archive}.tar.br`))));
      execFileSync('tar', ['xf', tar, '-C', libDir]);
      fs.unlinkSync(tar); fs.writeFileSync(marker, 'ok');
    }
  }
  process.env.LD_LIBRARY_PATH = [libDir, path.join(libDir, 'lib'), process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');
  const executablePath = await sparticuz.executablePath();
  const launchBrowser = () => chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || executablePath,
    headless: true,
    args: [...sparticuz.args.filter(arg => process.env.CHROMIUM_MULTIPROCESS !== '1' || !['--single-process','--in-process-gpu'].includes(arg)), '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  return launchBrowser();
}


/** Optional timestamped CDP recording; never enabled in performance-profile runs. */
export async function startBrowserRecording(context, page, out) {
  const timeOriginMs = await page.evaluate(() => performance.timeOrigin);
  const cdp = await context.newCDPSession(page);
  const frames = [];
  let resolveFirstFrame;
  const firstFrame = new Promise(resolve => { resolveFirstFrame = resolve; });
  const onFrame = async event => {
    const file = `motion-${String(frames.length).padStart(4, '0')}.jpg`;
    fs.writeFileSync(path.join(out, file), Buffer.from(event.data, 'base64'));
    frames.push({ file, time: event.metadata.timestamp });
    resolveFirstFrame();
    await cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  };
  cdp.on('Page.screencastFrame', onFrame);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: 960, maxHeight: 600, everyNthFrame: 1 });
  return {
    async waitForFirstFrame() {
      let timer;
      try { await Promise.race([firstFrame, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('No initial screencast frame')), 15000); })]); }
      finally { clearTimeout(timer); }
    },
    async stop() {
      // Capture bookends, not only events that happened to arrive before completion.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await cdp.send('Page.stopScreencast');
      cdp.off('Page.screencastFrame', onFrame);
      fs.writeFileSync(path.join(out, 'recording.json'), JSON.stringify({ timeOriginMs, frames }, null, 2));
      await cdp.detach();
      return frames.length;
    },
  };
}

/** Actual CDP transfer lengths, independent of the browser's Resource Timing buffer. */
export async function observeBrowserNetwork(context, page) {
  const cdp = await context.newCDPSession(page);
  const requests = new Map();
  const ensure = id => {
    if (!requests.has(id)) requests.set(id, { bytes: 0, decodedBytes: 0 });
    return requests.get(id);
  };
  cdp.on('Network.responseReceived', event => Object.assign(ensure(event.requestId), {
    url: event.response.url, status: event.response.status,
    fromDiskCache: !!event.response.fromDiskCache,
  }));
  cdp.on('Network.dataReceived', event => { ensure(event.requestId).decodedBytes += event.dataLength; });
  cdp.on('Network.loadingFinished', event => { ensure(event.requestId).bytes = event.encodedDataLength; });
  cdp.on('Network.loadingFailed', event => { ensure(event.requestId).error = event.errorText; });
  await cdp.send('Network.enable');
  return {
    async stop() {
      await cdp.send('Network.disable');
      await cdp.detach();
      const entries = [...requests.values()];
      return {
        method: 'CDP loadingFinished encodedDataLength (headers/compressed transfer); dataReceived dataLength (decoded chunks). Initial home load and clock scenario, not a complete crawl.',
        requests: entries, transferredBytes: entries.reduce((n, r) => n + r.bytes, 0),
        decodedChunkBytes: entries.reduce((n, r) => n + r.decodedBytes, 0),
      };
    },
  };
}
