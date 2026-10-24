#!/usr/bin/env node
/**
 * Reproducible Clean-Room Astronaut GLB Builder (`public/models/astronaut.glb`)
 *
 * Upstream Source:
 *   NASA 3D Resources — "Gemini Spacesuit" (`3D Models/Gemini Spacesuit/Gemini Spacesuit.glb`)
 *   Repository: https://github.com/nasa/NASA-3D-Resources
 *   Upstream Git Blob SHA: c4166e134ff5c7a6a8d98517ea395521d09c6df1 (2,876,516 bytes)
 *   Upstream Authors: Jason Duley & Matthew Sanders (NASA Ames Research Center)
 *   License: United States Government Public Domain (17 U.S.C. § 105 — "These assets are free
 *            and without copyright", per NASA-3D-Resources/README.md & NASA Media Usage Guidelines;
 *            repo metadata also lists NASA Open Source Agreement Version 1.3 in meta.json).
 *            Zero NASA Meatball/Worm insignia included; no NASA endorsement implied.
 *
 * Processing Pipeline:
 *   1. Reads raw NASA public-domain `Gemini Spacesuit.glb` (18 primitives), strips non-suit floor
 *      cooling box (`prim 12`), hanging floor hose (`prim 11`), chest lanyard wire (`prims 13,16,17`),
 *      and forearm hose port (`prims 5,6,7,14`), and centers suit symmetry in canonical right-handed
 *      character space (+X = character left / viewer right, +Y = up, +Z = forward, hip origin).
 *   2. Adds clean procedural EVA suit tailoring matching the spacewalk reference silhouette:
 *      - Full-length vertical center storm-flap seam from collar ring to crotch buckle + slider tabs
 *      - Wide contoured quilted left & right chest pockets with gathered lower pleats
 *      - Horizontal upper-chest harness strap + black rectangular ladder-lock shoulder buckles
 *      - Viewer-right ribcage white pen loop tab + clipped black EVA pen
 *      - Symmetrical flush matte-black left & right lower-belly ports with stitched white collars
 *      - Contoured vertically-pleated white thigh/knee pads + matte-black boot soles
 *      - Compact contoured white PLSS life-support pack tucked flush between shoulder blades
 *      - Wide curved dark visor dome + black perimeter seal + double black/white neck disconnect ring
 *   3. Computes clean UVs (`TEXCOORD_0`) and generates 2048x2048 seamless organic Beta-cloth wrinkle &
 *      ripstop normal map + 2048x2048 AO/roughness map encoded as WebP via `sharp`.
 *   4. Attaches a 15-bone glTF humanoid skin (`Hips`, `Spine`, `Chest`, `Neck`, `Head`,
 *      `ShoulderL`, `ElbowL`, `WristL`, `ShoulderR`, `ElbowR`, `WristR`, `HipL`, `KneeL`, `HipR`, `KneeR`).
 *   5. Compresses with `@gltf-transform` (`MeshoptEncoder` + WebP + `KHR_mesh_quantization`) < 2 MB.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import sharp from "sharp";
import { Document, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  EXTTextureWebP,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { dedup, weld, simplify, meshopt } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const RAW_GLB_CANDIDATES = [
  "/tmp/astronaut-src/Gemini_Spacesuit_raw.glb",
  "/tmp/astro-inspect/Gemini Spacesuit.glb",
];
const RAW_GLB_PATH = RAW_GLB_CANDIDATES.find((p) => fs.existsSync(p));
if (!RAW_GLB_PATH) {
  throw new Error(
    "Missing upstream raw Gemini Spacesuit.glb in /tmp/astronaut-src/Gemini_Spacesuit_raw.glb"
  );
}
const OUT_GLB_PATH = path.resolve("public/models/astronaut.glb");

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;

const rawBytes = fs.readFileSync(RAW_GLB_PATH);
const rawSha256 = crypto.createHash("sha256").update(rawBytes).digest("hex");

// ---------------------------------------------------------------------------
// 1. Canonical Orthonormal Frame (+X = viewer right / anatomical left, +Y = up, +Z = forward)
//    det([eX, eY, eZ]) = +1.0000 (strictly right-handed; no inverted normals!)
// ---------------------------------------------------------------------------
const EX = new THREE.Vector3(-0.9597, 0, 0.2809).normalize();
const EY = new THREE.Vector3(0, 1, 0);
const EZ = new THREE.Vector3().crossVectors(EX, EY).normalize();
const ORIGIN = new THREE.Vector3(3.369, 1.0, 3.675);
const MODEL_SCALE = 0.72;
// True bilateral symmetry offset measured from raw helmet/neck/boot bounds
const X_CENTER_SHIFT = 0.0115;

function toCanonical(v) {
  const dx = v.x - ORIGIN.x;
  const dy = v.y - ORIGIN.y;
  const dz = v.z - ORIGIN.z;
  return new THREE.Vector3(
    (dx * EX.x + dz * EX.z) * MODEL_SCALE + X_CENTER_SHIFT,
    dy * MODEL_SCALE,
    (dx * EZ.x + dz * EZ.z) * MODEL_SCALE
  );
}

function normalToCanonical(n) {
  return new THREE.Vector3(
    n.x * EX.x + n.z * EX.z,
    n.y,
    n.x * EZ.x + n.z * EZ.z
  ).normalize();
}

// ---------------------------------------------------------------------------
// 2. Generate 2048x2048 Organic EVA Cloth Wrinkle + Ripstop Normal & ORM Maps
// ---------------------------------------------------------------------------
async function createQuiltedFabricTextures(size = 2048) {
  const heightField = new Float32Array(size * size);
  const roughBuf = Buffer.alloc(size * size * 3);
  const normalBuf = Buffer.alloc(size * size * 3);

  const hash2 = (ix, iy) => {
    const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  };

  const valueNoise = (x, y, period) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const wrap = (k) => ((k % period) + period) % period;
    const x0 = wrap(xi),
      x1 = wrap(xi + 1);
    const y0 = wrap(yi),
      y1 = wrap(yi + 1);
    const a = hash2(x0, y0);
    const b = hash2(x1, y0);
    const c = hash2(x0, y1);
    const d = hash2(x1, y1);
    return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
  };

  const fbm = (u, v, basePeriod, octaves = 4) => {
    let sum = 0;
    let amp = 0.5;
    let p = basePeriod;
    for (let o = 0; o < octaves; o++) {
      sum += amp * valueNoise(u * p, v * p, p);
      p *= 2;
      amp *= 0.5;
    }
    return sum;
  };

  for (let py = 0; py < size; py++) {
    const v = py / size;
    for (let px = 0; px < size; px++) {
      const u = px / size;

      // Natural pressurized EVA cloth tension folds + subtle stitched panel seams
      const warpU = u + (fbm(u, v, 6) - 0.5) * 0.14;
      const warpV = v + (fbm(u + 0.37, v + 0.19, 6) - 0.5) * 0.08;

      const panelPhase = (warpV * 8.0) % 1.0;
      const stitchSeam = Math.exp(-Math.pow(Math.min(panelPhase, 1.0 - panelPhase) * 30.0, 2.0));
      const softPillow = Math.sin(Math.PI * panelPhase) ** 0.42;

      // Diagonal & transverse sleeve/torso compression creases (matching detail_04 & detail_05!)
      const creaseA = Math.sin((warpU * 7.0 + warpV * 3.0 + fbm(u, v, 10) * 2.2) * Math.PI * 2.0);
      const creaseB = Math.sin((warpV * 18.0 + fbm(u + 0.5, v, 12) * 3.1) * Math.PI * 2.0);
      const macroFold = fbm(u * 1.0, v * 1.0, 12, 4) - 0.5;

      // Fine Ortho-Fabric Beta-cloth ripstop micro-weave
      const ripU = Math.abs(((u * 224.0) % 1.0) - 0.5) * 2.0;
      const ripV = Math.abs(((v * 224.0) % 1.0) - 0.5) * 2.0;
      const ripstop = (1.0 - Math.min(ripU, ripV)) * 0.085;

      const h =
        softPillow * 0.24 -
        stitchSeam * 0.30 +
        creaseA * 0.11 +
        creaseB * 0.065 +
        macroFold * 0.34 +
        ripstop;

      heightField[py * size + px] = h;

      // glTF MetallicRoughness layout: R = Ambient Occlusion, G = Roughness, B = Metalness
      const ao = Math.round(
        Math.max(128, Math.min(255, 226 + h * 72 - stitchSeam * 52 - Math.max(0, -creaseA) * 16))
      );
      const rough = Math.round(
        Math.max(122, Math.min(236, 174 - softPillow * 18 + stitchSeam * 34 + ripstop * 44))
      );
      const off = (py * size + px) * 3;
      roughBuf[off] = ao;
      roughBuf[off + 1] = rough;
      roughBuf[off + 2] = 0;
    }
  }

  const strength = 2.35;
  for (let py = 0; py < size; py++) {
    const ym = ((py - 1 + size) % size) * size;
    const yp = ((py + 1) % size) * size;
    const y0 = py * size;
    for (let px = 0; px < size; px++) {
      const xm = (px - 1 + size) % size;
      const xp = (px + 1) % size;
      const dX = (heightField[y0 + xp] - heightField[y0 + xm]) * strength;
      const dY = (heightField[yp + px] - heightField[ym + px]) * strength;
      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const inv = 1.0 / Math.hypot(nx, ny, nz);
      nx *= inv;
      ny *= inv;
      nz *= inv;
      const off = (y0 + px) * 3;
      normalBuf[off] = Math.round((nx * 0.5 + 0.5) * 255);
      normalBuf[off + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalBuf[off + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    }
  }

  const normalWebp = await sharp(normalBuf, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality: 88, effort: 4 })
    .toBuffer();

  const ormWebp = await sharp(roughBuf, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality: 86, effort: 4 })
    .toBuffer();

  return { normalWebp, ormWebp };
}

// ---------------------------------------------------------------------------
// 3. Geometry Helpers in Canonical Right-Handed Space
// ---------------------------------------------------------------------------
function prepHelperGeo(geo, forcedJoint = -1, uvScale = 2.4) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const pos = g.getAttribute("position");
  const cnt = pos.count;
  if (!g.getAttribute("uv") || uvScale > 0) {
    const uvArr = new Float32Array(cnt * 2);
    for (let i = 0; i < cnt; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
      const axial = y + Math.abs(x) * 0.45;
      uvArr[i * 2] = angle * uvScale;
      uvArr[i * 2 + 1] = axial * uvScale;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
  }
  const rigidArr = new Float32Array(cnt).fill(forcedJoint);
  g.setAttribute("rigidJoint", new THREE.BufferAttribute(rigidArr, 1));
  for (const key of Object.keys(g.attributes)) {
    if (key !== "position" && key !== "normal" && key !== "uv" && key !== "rigidJoint") {
      g.deleteAttribute(key);
    }
  }
  return g;
}

function primToThreeGeometry(prim, uvScale = 2.4) {
  const posArr = prim.getAttribute("POSITION").getArray();
  const normAttr = prim.getAttribute("NORMAL");
  const normArr = normAttr ? normAttr.getArray() : null;
  const idxAttr = prim.getIndices();

  const n = posArr.length / 3;
  const outPos = new Float32Array(n * 3);
  const outNorm = new Float32Array(n * 3);

  const tmpV = new THREE.Vector3();
  const tmpN = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    tmpV.set(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
    const c = toCanonical(tmpV);

    let cn = null;
    if (normArr) {
      tmpN.set(normArr[i * 3], normArr[i * 3 + 1], normArr[i * 3 + 2]);
      cn = normalToCanonical(tmpN);
    }

    // Relaxed natural zero-g EVA glove curl below knuckle line (`|x| > 0.27, y < -0.055`):
    // In rest pose, palms face inward toward body centerline (`-sign(x)`), thumbs forward (`+Z`).
    // Curling fingers gently inward (`max ~44 deg`) converts stiff splayed rest hands into natural EVA gloves!
    if (Math.abs(c.x) > 0.27 && c.y < -0.055) {
      const sgn = Math.sign(c.x); // -1 right hand, +1 left hand
      const knuckleY = -0.055;
      const knuckleX = sgn * 0.345;
      const dist = Math.min(0.125, knuckleY - c.y);
      // Reduce curl slightly on anterior thumb (`c.z > 0.045`) so thumb opposes fingers naturally
      const thumbMask = c.z > 0.055 ? 0.45 : 1.0;
      const theta = -sgn * (dist / 0.125) * 0.78 * thumbMask;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const rx = c.x - knuckleX;
      const ry = c.y - knuckleY;
      c.x = knuckleX + rx * cosT - ry * sinT;
      c.y = knuckleY + rx * sinT + ry * cosT;
      if (cn) {
        const nx = cn.x * cosT - cn.y * sinT;
        const ny = cn.x * sinT + cn.y * cosT;
        cn.x = nx;
        cn.y = ny;
      }
    }

    outPos[i * 3] = c.x;
    outPos[i * 3 + 1] = c.y;
    outPos[i * 3 + 2] = c.z;

    if (cn) {
      outNorm[i * 3] = cn.x;
      outNorm[i * 3 + 1] = cn.y;
      outNorm[i * 3 + 2] = cn.z;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(outPos, 3));
  if (normArr) {
    geo.setAttribute("normal", new THREE.BufferAttribute(outNorm, 3));
  }
  if (idxAttr) {
    const srcIdx = idxAttr.getArray();
    geo.setIndex(
      srcIdx.length > 65535 || n > 65535
        ? new THREE.BufferAttribute(new Uint32Array(srcIdx), 1)
        : new THREE.BufferAttribute(new Uint16Array(srcIdx), 1)
    );
  }
  if (!normArr) {
    geo.computeVertexNormals();
  }
  return prepHelperGeo(geo, -1, uvScale);
}

function filterGeometryTriangles(geo, keepPredicate) {
  const pos = geo.getAttribute("position").array;
  const norm = geo.getAttribute("normal").array;
  const uv = geo.getAttribute("uv").array;
  const rigid = geo.getAttribute("rigidJoint").array;
  const keepTris = [];
  const triCount = pos.length / 9;
  for (let t = 0; t < triCount; t++) {
    const o = t * 9;
    const cx = (pos[o] + pos[o + 3] + pos[o + 6]) / 3;
    const cy = (pos[o + 1] + pos[o + 4] + pos[o + 7]) / 3;
    const cz = (pos[o + 2] + pos[o + 5] + pos[o + 8]) / 3;
    const ny = (norm[o + 1] + norm[o + 4] + norm[o + 7]) / 3;
    const maxZ = Math.max(pos[o + 2], pos[o + 5], pos[o + 8]);
    if (keepPredicate({ cx, cy, cz, ny, maxZ })) keepTris.push(t);
  }
  const n = keepTris.length * 3;
  const oPos = new Float32Array(n * 3);
  const oNorm = new Float32Array(n * 3);
  const oUv = new Float32Array(n * 2);
  const oRigid = new Float32Array(n);
  for (let k = 0; k < keepTris.length; k++) {
    const t = keepTris[k];
    oPos.set(pos.subarray(t * 9, t * 9 + 9), k * 9);
    oNorm.set(norm.subarray(t * 9, t * 9 + 9), k * 9);
    oUv.set(uv.subarray(t * 6, t * 6 + 6), k * 6);
    oRigid.set(rigid.subarray(t * 3, t * 3 + 3), k * 3);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(oPos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(oNorm, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(oUv, 2));
  out.setAttribute("rigidJoint", new THREE.BufferAttribute(oRigid, 1));
  return out;
}

// ---------------------------------------------------------------------------
// 4. Read Raw NASA `Gemini Spacesuit.glb` & Assemble Clean Sculpted EVA Suit
// ---------------------------------------------------------------------------
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization])
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });

const rawDoc = await io.read(RAW_GLB_PATH);
const rawPrims = rawDoc.getRoot().listMeshes()[0].listPrimitives();

// Split boots (`Prims 8 & 9`) cleanly into white upper boot shell + matte-black rubber boot sole!
const bootLeftRaw = primToThreeGeometry(rawPrims[8], 2.4);
const bootRightRaw = primToThreeGeometry(rawPrims[9], 2.4);

const bootUpperPredicate = ({ cy, ny }) => !(cy < -0.698 || (cy < -0.665 && ny < -0.45));
const bootSolePredicate = (info) => !bootUpperPredicate(info);

// Black wrist rings & visor gasket from `Prim 1` (keep clean cuff rings & helmet rim, skip ankle stripes)
const blackTrimPrim1 = filterGeometryTriangles(
  primToThreeGeometry(rawPrims[1], 2.4),
  ({ cy }) => cy > -0.45
);

const fabricGeos = [
  primToThreeGeometry(rawPrims[0], 2.0), // Outer white Gemini/EMU helmet shell
  filterGeometryTriangles(primToThreeGeometry(rawPrims[2], 2.6), ({ maxZ }) => maxZ <= 0.145),
  primToThreeGeometry(rawPrims[10], 2.6), // 24,300-vertex sculpted wrinkled cloth torso/arms/gloves/legs
  filterGeometryTriangles(bootLeftRaw, bootUpperPredicate),
  filterGeometryTriangles(bootRightRaw, bootUpperPredicate),
];

const webbingGeos = [
  primToThreeGeometry(rawPrims[15], 3.0), // White shoulder-to-hip-to-crotch parachute harness straps
];

const darkGeos = [
  primToThreeGeometry(rawPrims[4], 2.0), // Black anodized neck disconnect collar ring
  blackTrimPrim1,                        // Black glove wrist disconnect rings & helmet seal
  filterGeometryTriangles(bootLeftRaw, bootSolePredicate),  // Left black boot sole (visible in Frame 08!)
  filterGeometryTriangles(bootRightRaw, bootSolePredicate), // Right black boot sole
];

// Measure exact torso front Z profile `zFront(y)` directly from `Prim 10` so chest pockets, center
// storm-flap seam, pen loop, chest strap, and belly ports sit FLUSH against the suit cloth!
const bodyPos = fabricGeos[2].getAttribute("position");
function sampleTorsoFrontZ(targetY, halfBandX = 0.09) {
  let bestZ = 0.108;
  for (let i = 0; i < bodyPos.count; i++) {
    const x = bodyPos.getX(i);
    const y = bodyPos.getY(i);
    const z = bodyPos.getZ(i);
    if (Math.abs(x) <= halfBandX && Math.abs(y - targetY) <= 0.022 && z > bestZ) {
      bestZ = z;
    }
  }
  return bestZ;
}

// 4A. Continuous Center Vertical Zipper Storm-Flap (`collar y = 0.475 -> crotch y = -0.055`, matching detail_04/05!)
{
  const curvePts = [];
  const N_PTS = 14;
  for (let i = 0; i <= N_PTS; i++) {
    const t = i / N_PTS;
    const y = -0.055 + t * (0.475 - -0.055);
    const z = sampleTorsoFrontZ(y, 0.045) + 0.004;
    curvePts.push(new THREE.Vector3(0.0, y, z));
  }
  const flapCurve = new THREE.CatmullRomCurve3(curvePts);
  const stormFlap = new THREE.TubeGeometry(flapCurve, 32, 0.0115, 10, false);
  stormFlap.scale(1.25, 1.0, 0.62);
  webbingGeos.push(prepHelperGeo(stormFlap, -1, 3.2));

  // Upper chest slider buckle (`y = 0.402`) + lower crotch strap buckle (`y = -0.052`)
  const topSlider = new THREE.BoxGeometry(0.022, 0.028, 0.012);
  topSlider.translate(0.0, 0.402, sampleTorsoFrontZ(0.402, 0.05) + 0.008);
  webbingGeos.push(prepHelperGeo(topSlider, 2, 2.0));

  const crotchBuckle = new THREE.BoxGeometry(0.032, 0.022, 0.014);
  crotchBuckle.translate(0.0, -0.052, sampleTorsoFrontZ(-0.052, 0.06) + 0.008);
  webbingGeos.push(prepHelperGeo(crotchBuckle, 0, 2.0));
}

// 4B. Horizontal Upper-Chest Harness Strap + Black Rectangular Shoulder Buckles (`detail_04` & `detail_05`!)
{
  const yStrap = 0.402;
  const zMid = sampleTorsoFrontZ(yStrap, 0.09);
  const chestStrapPts = [
    new THREE.Vector3(-0.106, yStrap - 0.004, zMid - 0.008),
    new THREE.Vector3(-0.055, yStrap, zMid + 0.005),
    new THREE.Vector3(0.0, yStrap + 0.001, zMid + 0.007),
    new THREE.Vector3(0.055, yStrap, zMid + 0.005),
    new THREE.Vector3(0.106, yStrap - 0.004, zMid - 0.008),
  ];
  const strapTube = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(chestStrapPts),
    20,
    0.0095,
    8,
    false
  );
  strapTube.scale(1.0, 1.15, 0.42);
  webbingGeos.push(prepHelperGeo(strapTube, 2, 3.0));

  for (const side of [-1, 1]) {
    const bx = side * 0.104;
    const bz = sampleTorsoFrontZ(yStrap, 0.115) - 0.002;
    const buckle = new THREE.BoxGeometry(0.028, 0.024, 0.013);
    buckle.rotateY(-side * 0.20);
    buckle.translate(bx, yStrap, bz + 0.005);
    darkGeos.push(prepHelperGeo(buckle, 2, 2.0));
  }

  // Small horizontal strapkeeper tab + black snap pin under viewer-right black buckle (`detail_05`!)
  const keeperTab = new THREE.BoxGeometry(0.040, 0.015, 0.010);
  keeperTab.rotateY(-0.22);
  keeperTab.rotateZ(-0.08);
  keeperTab.translate(0.102, 0.370, zMid + 0.002);
  webbingGeos.push(prepHelperGeo(keeperTab, 2, 2.5));

  const keeperPin = new THREE.SphereGeometry(0.0038, 10, 8);
  keeperPin.translate(0.114, 0.370, zMid + 0.008);
  darkGeos.push(prepHelperGeo(keeperPin, 2, 2.0));
}

// 4C. Wide Contoured Gathered-Pleat Left & Right Chest Pockets (`detail_04` & `detail_05`!)
{
  const yPock = 0.298;
  const zPock = sampleTorsoFrontZ(yPock, 0.09);
  for (const side of [-1, 1]) {
    const pGeo = new THREE.BoxGeometry(0.088, 0.068, 0.032, 18, 12, 4);
    const pa = pGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      let x = pa.getX(i);
      let y = pa.getY(i);
      let z = pa.getZ(i);
      const nx = x / 0.044;
      const ny = y / 0.034;
      // Soft pillow rounding + gathered vertical pleats along bottom hem (`detail_05`!)
      const dome = Math.max(0, 1 - nx * nx * 0.42) * Math.max(0, 1 - ny * ny * 0.55);
      if (z > 0) {
        const pleat = Math.sin((nx * 5.5) * Math.PI) * 0.0024 * Math.max(0, 1 - Math.abs(ny + 0.25));
        z = z * (0.45 + 0.72 * dome) + pleat;
      } else {
        z *= 0.35;
      }
      // Subtle ergonomic slant matching ribcage contour
      y += -Math.abs(nx) * 0.004;
      z -= nx * nx * 0.008;
      pa.setXYZ(i, x, y, z);
    }
    pGeo.computeVertexNormals();
    pGeo.rotateY(-side * 0.16);
    pGeo.rotateZ(-side * 0.05);
    pGeo.translate(side * 0.060, yPock, zPock + 0.004);
    fabricGeos.push(prepHelperGeo(pGeo, 2, 2.8));
  }
}

// 4D. Viewer-Right Ribcage Horizontal White Loop Tab + Black Pen Clip (`detail_04` & `detail_05`!)
{
  const yPen = 0.226;
  const zPen = sampleTorsoFrontZ(yPen, 0.075);
  const penTab = new THREE.BoxGeometry(0.048, 0.015, 0.012, 4, 2, 2);
  penTab.rotateY(-0.10);
  penTab.translate(0.036, yPen, zPen + 0.006);
  webbingGeos.push(prepHelperGeo(penTab, 1, 2.8));

  const penBody = new THREE.CylinderGeometry(0.0052, 0.0042, 0.050, 12);
  penBody.rotateZ(0.04);
  penBody.translate(0.054, yPen - 0.014, zPen + 0.008);
  darkGeos.push(prepHelperGeo(penBody, 1, 2.0));
}

// 4E. Two Clean Symmetrical Flush Matte-Black Circular Belly Ports (`detail_01`, `detail_04`, `detail_05`, `07`!)
{
  const yPort = 0.156;
  const zPort = sampleTorsoFrontZ(yPort, 0.085);
  for (const side of [-1, 1]) {
    const px = side * 0.066;
    // Subtle flush white fabric mounting seam collar
    const seamRing = new THREE.TorusGeometry(0.0255, 0.0042, 12, 28);
    seamRing.rotateY(-side * 0.22);
    seamRing.scale(0.92, 1.05, 0.55);
    seamRing.translate(px, yPort, zPort - 0.001);
    webbingGeos.push(prepHelperGeo(seamRing, 1, 2.6));

    // Flush recessed matte-black circular port disc
    const portDisc = new THREE.CylinderGeometry(0.0235, 0.0225, 0.012, 28);
    portDisc.rotateX(Math.PI * 0.5);
    portDisc.rotateY(-side * 0.22);
    portDisc.scale(0.92, 1.05, 1.0);
    portDisc.translate(px, yPort, zPort - 0.002);
    darkGeos.push(prepHelperGeo(portDisc, 1, 2.0));
  }
}

// 4F. Sculpted Vertically-Pleated White Knee Pads (`detail_04`!)
{
  for (const side of [-1, 1]) {
    const padGeo = new THREE.BoxGeometry(0.072, 0.108, 0.022, 16, 12, 4);
    const pa = padGeo.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      let x = pa.getX(i);
      const y = pa.getY(i);
      let z = pa.getZ(i);
      const nx = x / 0.036;
      const ny = y / 0.054;
      const edgeRound = Math.max(0, 1 - Math.pow(Math.abs(nx), 3.0)) * Math.max(0, 1 - Math.pow(Math.abs(ny), 3.2));
      if (z > 0) {
        const vPleat = Math.cos(nx * Math.PI * 4.0) * 0.0022 * edgeRound;
        z = z * (0.35 + 0.68 * edgeRound) + vPleat - nx * nx * 0.008;
      } else {
        z = z * 0.25 - nx * nx * 0.008;
      }
      pa.setXYZ(i, x, y, z);
    }
    padGeo.computeVertexNormals();
    const kx = side < 0 ? -0.096 : 0.104;
    const kz = side < 0 ? 0.048 : 0.058;
    padGeo.rotateY(-side * 0.10);
    padGeo.translate(kx, -0.225, kz);
    // Rigid on HipR (11) / HipL (13) so thigh/knee pads track thigh cleanly!
    fabricGeos.push(prepHelperGeo(padGeo, side < 0 ? 11 : 13, 2.8));
  }
}

// 4G. Compact Anatomical Contoured White Back Pack + Back Spine Seam (`07` & `08` — ZERO front overhang!)
{
  const shape = new THREE.Shape();
  const bw = 0.076,
    bh = 0.118,
    br = 0.034;
  shape.moveTo(-bw + br, -bh);
  shape.lineTo(bw - br, -bh);
  shape.quadraticCurveTo(bw, -bh, bw, -bh + br);
  shape.lineTo(bw, bh - br);
  shape.quadraticCurveTo(bw, bh, bw - br, bh);
  shape.lineTo(-bw + br, bh);
  shape.quadraticCurveTo(-bw, bh, -bw, bh - br);
  shape.lineTo(-bw, -bh + br);
  shape.quadraticCurveTo(-bw, -bh, -bw + br, -bh);

  const packGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.048,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: 0.022,
    bevelThickness: 0.024,
  });
  // Tucked cleanly against mid-back (`z = -0.142`, width `±0.098` well inside shoulders `±0.16`!)
  packGeo.translate(0.0, 0.312, -0.145);
  fabricGeos.push(prepHelperGeo(packGeo, 2, 2.4));

  // Vertical back center seam continuing from bottom of pack down to seat (`Frame 08`!)
  const backSeamPts = [
    new THREE.Vector3(0.0, 0.19, -0.105),
    new THREE.Vector3(0.0, 0.08, -0.104),
    new THREE.Vector3(0.0, -0.04, -0.098),
  ];
  const backSeam = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(backSeamPts), 14, 0.0085, 8, false);
  webbingGeos.push(prepHelperGeo(backSeam, -1, 3.0));
}

// 4H. Helmet Dome, Double Neck Ring, & Wide Curved Dark EVA Visor (`detail_01`, `detail_04`, `detail_05`!)
const helmetGeoCheck = fabricGeos[0];
helmetGeoCheck.computeBoundingBox();
const hCenter = new THREE.Vector3();
const hSize = new THREE.Vector3();
helmetGeoCheck.boundingBox.getCenter(hCenter);
helmetGeoCheck.boundingBox.getSize(hSize);

// Clean white lower neck collar ring + black anodized seal ring (`detail_05` double-band collar!)
{
  const whiteNeckBand = new THREE.TorusGeometry(0.098, 0.010, 12, 32);
  whiteNeckBand.rotateX(Math.PI * 0.5 + 0.14);
  whiteNeckBand.scale(0.96, 1.02, 1.0);
  whiteNeckBand.translate(hCenter.x, 0.506, hCenter.z - 0.004);
  fabricGeos.push(prepHelperGeo(whiteNeckBand, 3, 2.2));

  const blackChinLatch = new THREE.BoxGeometry(0.026, 0.016, 0.016);
  blackChinLatch.translate(hCenter.x, 0.500, hCenter.z + 0.098);
  darkGeos.push(prepHelperGeo(blackChinLatch, 4, 2.0));
}

const visorRadius = hSize.x * 0.515;
const visorPhiLen = Math.PI * 0.78;
const visorThetaStart = Math.PI * 0.245;
const visorThetaLen = Math.PI * 0.435;

const visorDome = new THREE.SphereGeometry(
  visorRadius,
  44,
  30,
  Math.PI * 0.5 - visorPhiLen * 0.5,
  visorPhiLen,
  visorThetaStart,
  visorThetaLen
);
visorDome.scale(0.99, 0.96, 1.055);
visorDome.translate(hCenter.x, hCenter.y - 0.006, hCenter.z + 0.012);

const browShell = new THREE.SphereGeometry(
  visorRadius * 1.032,
  40,
  22,
  Math.PI * 0.5 - Math.PI * 0.86 * 0.5,
  Math.PI * 0.86,
  0.02,
  visorThetaStart + 0.032
);
browShell.scale(1.0, 0.98, 1.05);
browShell.translate(hCenter.x, hCenter.y - 0.004, hCenter.z + 0.010);
fabricGeos.push(prepHelperGeo(browShell, 4, 2.0));

const visorTrim = new THREE.SphereGeometry(
  visorRadius * 1.012,
  40,
  24,
  Math.PI * 0.5 - (visorPhiLen + 0.085) * 0.5,
  visorPhiLen + 0.085,
  visorThetaStart - 0.032,
  visorThetaLen + 0.070
);
visorTrim.scale(0.995, 0.965, 1.044);
visorTrim.translate(hCenter.x, hCenter.y - 0.006, hCenter.z + 0.010);
darkGeos.push(prepHelperGeo(visorTrim, 4, 2.0));

for (const side of [-1, 1]) {
  const earPod = new THREE.CylinderGeometry(0.022, 0.022, 0.012, 18);
  earPod.rotateZ(Math.PI * 0.5);
  earPod.translate(hCenter.x + side * (hSize.x * 0.485), hCenter.y - 0.012, hCenter.z + 0.012);
  fabricGeos.push(prepHelperGeo(earPod, 4, 2.0));
}

const visorGeos = [
  primToThreeGeometry(rawPrims[3], 1.5),
  prepHelperGeo(visorDome, 4, 1.5),
];

const mergedGroups = [
  { name: "suit_fabric", geo: mergeGeometries(fabricGeos, false) },
  { name: "suit_webbing", geo: mergeGeometries(webbingGeos, false) },
  { name: "suit_dark_hardware", geo: mergeGeometries(darkGeos, false) },
  { name: "visor_glass", geo: mergeGeometries(visorGeos, false) },
];

// ---------------------------------------------------------------------------
// 5. Anatomical 15-Bone glTF Skeleton + Smooth Cosine Joint Skin Weights
// ---------------------------------------------------------------------------
const BONE_DEFS = [
  { name: "Hips", parent: -1, pos: [0.0, 0.0, 0.0] },
  { name: "Spine", parent: 0, pos: [0.0, 0.14, 0.0] },
  { name: "Chest", parent: 1, pos: [0.0, 0.29, 0.0] },
  { name: "Neck", parent: 2, pos: [0.0, 0.505, 0.005] },
  { name: "Head", parent: 3, pos: [0.0, 0.605, 0.01] },
  { name: "ShoulderR", parent: 2, pos: [-0.145, 0.345, -0.015] },
  { name: "ElbowR", parent: 5, pos: [-0.245, 0.185, -0.025] },
  { name: "WristR", parent: 6, pos: [-0.315, 0.015, -0.015] },
  { name: "ShoulderL", parent: 2, pos: [0.145, 0.355, 0.015] },
  { name: "ElbowL", parent: 8, pos: [0.245, 0.195, 0.045] },
  { name: "WristL", parent: 9, pos: [0.315, 0.015, 0.065] },
  { name: "HipR", parent: 0, pos: [-0.078, -0.035, -0.01] },
  { name: "KneeR", parent: 11, pos: [-0.088, -0.35, -0.03] },
  { name: "HipL", parent: 0, pos: [0.078, -0.035, 0.015] },
  { name: "KneeL", parent: 13, pos: [0.105, -0.35, -0.005] },
];

const sstep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function computeSkinWeightsForVertex(x, y, z, groupName) {
  const w = new Float32Array(15);

  if (groupName === "visor_glass" || y > 0.535) {
    const neckBlend = sstep(0.495, 0.545, y);
    w[4] = neckBlend;
    w[3] = 1.0 - neckBlend;
    return w;
  }

  if (z < -0.118) {
    w[2] = 1.0;
    return w;
  }

  const absX = Math.abs(x);
  if (absX > 0.215 || (y > 0.055 && absX > 0.145)) {
    const isLeft = x > 0;
    const jSh = isLeft ? 8 : 5;
    const jEl = isLeft ? 9 : 6;
    const jWr = isLeft ? 10 : 7;

    const inArm = sstep(0.145, 0.195, absX);
    const chestW = 1.0 - inArm;
    const elY = isLeft ? 0.195 : 0.185;
    const wrY = 0.015;

    const belowElbow = sstep(elY + 0.045, elY - 0.045, y);
    const belowWrist = sstep(wrY + 0.035, wrY - 0.035, y);

    w[2] = chestW;
    w[jSh] = inArm * (1.0 - belowElbow);
    w[jEl] = inArm * belowElbow * (1.0 - belowWrist);
    w[jWr] = inArm * belowWrist;
    return w;
  }

  if (y < -0.02) {
    const pelvisW = 1.0 - sstep(-0.02, -0.11, y);
    const sideL = sstep(-0.02, 0.035, x);
    const sideR = 1.0 - sideL;
    const belowKnee = sstep(-0.30, -0.39, y);

    w[0] = pelvisW;
    w[13] = (1.0 - pelvisW) * sideL * (1.0 - belowKnee);
    w[14] = (1.0 - pelvisW) * sideL * belowKnee;
    w[11] = (1.0 - pelvisW) * sideR * (1.0 - belowKnee);
    w[12] = (1.0 - pelvisW) * sideR * belowKnee;
    return w;
  }

  const toSpine = sstep(0.02, 0.14, y);
  const toChest = sstep(0.18, 0.30, y);
  const toNeck = sstep(0.47, 0.525, y);

  w[0] = 1.0 - toSpine;
  w[1] = toSpine * (1.0 - toChest);
  w[2] = toChest * (1.0 - toNeck);
  w[3] = toNeck;
  return w;
}

// ---------------------------------------------------------------------------
// 6. Build Clean glTF 2.0 Document + Embed 2K WebP Textures + Meshopt Compress
// ---------------------------------------------------------------------------
console.log("Generating 2048x2048 EVA cloth wrinkle/ripstop normal & ORM WebP maps...");
const { normalWebp, ormWebp } = await createQuiltedFabricTextures(2048);

const outDoc = new Document();
outDoc.getRoot().getAsset().copyright =
  "Derived from NASA 3D Resources 'Gemini Spacesuit' (U.S. Government Public Domain, 17 U.S.C. § 105). Courtesy of NASA Ames Research Center.";
outDoc.getRoot().getAsset().generator = "Website-Cloner-JP scripts/build-astronaut-glb.mjs";

const buf = outDoc.createBuffer("astronaut-bin");
const scene = outDoc.createScene("Scene");

const normalTex = outDoc
  .createTexture("suit_quilted_normal")
  .setMimeType("image/webp")
  .setImage(normalWebp);

const ormTex = outDoc
  .createTexture("suit_quilted_orm")
  .setMimeType("image/webp")
  .setImage(ormWebp);

const matFabric = outDoc
  .createMaterial("suit_fabric")
  .setBaseColorFactor([0.925, 0.938, 0.962, 1.0])
  .setRoughnessFactor(0.60)
  .setMetallicFactor(0.0)
  .setNormalTexture(normalTex)
  .setNormalScale(0.92)
  .setMetallicRoughnessTexture(ormTex)
  .setOcclusionTexture(ormTex)
  .setOcclusionStrength(0.85);

const matWebbing = outDoc
  .createMaterial("suit_webbing")
  .setBaseColorFactor([0.845, 0.862, 0.892, 1.0])
  .setRoughnessFactor(0.52)
  .setMetallicFactor(0.03)
  .setNormalTexture(normalTex)
  .setNormalScale(0.42)
  .setMetallicRoughnessTexture(ormTex)
  .setOcclusionTexture(ormTex)
  .setOcclusionStrength(0.88);

const matDark = outDoc
  .createMaterial("suit_dark_hardware")
  .setBaseColorFactor([0.032, 0.036, 0.046, 1.0])
  .setRoughnessFactor(0.38)
  .setMetallicFactor(0.35);

const matVisor = outDoc
  .createMaterial("visor_glass")
  .setBaseColorFactor([0.005, 0.007, 0.012, 1.0])
  .setRoughnessFactor(0.025)
  .setMetallicFactor(0.04);

const materialsByName = {
  suit_fabric: matFabric,
  suit_webbing: matWebbing,
  suit_dark_hardware: matDark,
  visor_glass: matVisor,
};

const rootNode = outDoc.createNode("AstronautRoot");
scene.addChild(rootNode);

const jointNodes = [];
const ibmFlat = new Float32Array(BONE_DEFS.length * 16);
const tmpMat = new THREE.Matrix4();

BONE_DEFS.forEach((b, idx) => {
  const jNode = outDoc.createNode(b.name);
  if (b.parent < 0) {
    jNode.setTranslation(b.pos);
    rootNode.addChild(jNode);
  } else {
    const pPos = BONE_DEFS[b.parent].pos;
    jNode.setTranslation([b.pos[0] - pPos[0], b.pos[1] - pPos[1], b.pos[2] - pPos[2]]);
    jointNodes[b.parent].addChild(jNode);
  }
  jointNodes.push(jNode);

  tmpMat.makeTranslation(-b.pos[0], -b.pos[1], -b.pos[2]);
  tmpMat.toArray(ibmFlat, idx * 16);
});

const ibmAcc = outDoc.createAccessor("ibm").setType("MAT4").setArray(ibmFlat).setBuffer(buf);
const skin = outDoc.createSkin("AstronautSkin").setSkeleton(jointNodes[0]).setInverseBindMatrices(ibmAcc);
for (const jn of jointNodes) skin.addJoint(jn);

const gltfMesh = outDoc.createMesh("AstronautSuitMesh");
let totalTriangles = 0;
let totalVerts = 0;

for (const { name, geo } of mergedGroups) {
  const posAttr = geo.getAttribute("position");
  const normAttr = geo.getAttribute("normal");
  const uvAttr = geo.getAttribute("uv");
  const rigidAttr = geo.getAttribute("rigidJoint");
  const vCount = posAttr.count;

  const jointsArr = new Uint16Array(vCount * 4);
  const weightsArr = new Float32Array(vCount * 4);

  for (let i = 0; i < vCount; i++) {
    const rj = rigidAttr ? Math.round(rigidAttr.getX(i)) : -1;
    if (rj >= 0) {
      jointsArr[i * 4] = rj;
      weightsArr[i * 4] = 1.0;
      continue;
    }

    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const rawW = computeSkinWeightsForVertex(x, y, z, name);

    const pairs = [];
    for (let j = 0; j < rawW.length; j++) {
      if (rawW[j] > 1e-5) pairs.push([j, rawW[j]]);
    }
    pairs.sort((a, b) => b[1] - a[1]);
    while (pairs.length < 4) pairs.push([0, 0]);
    const top4 = pairs.slice(0, 4);
    const sum = top4.reduce((acc, p) => acc + p[1], 0) || 1.0;

    for (let k = 0; k < 4; k++) {
      jointsArr[i * 4 + k] = top4[k][0];
      weightsArr[i * 4 + k] = top4[k][1] / sum;
    }
  }

  const prim = outDoc
    .createPrimitive()
    .setMaterial(materialsByName[name])
    .setAttribute(
      "POSITION",
      outDoc.createAccessor(`${name}_pos`).setType("VEC3").setArray(new Float32Array(posAttr.array)).setBuffer(buf)
    )
    .setAttribute(
      "NORMAL",
      outDoc.createAccessor(`${name}_norm`).setType("VEC3").setArray(new Float32Array(normAttr.array)).setBuffer(buf)
    )
    .setAttribute(
      "TEXCOORD_0",
      outDoc.createAccessor(`${name}_uv`).setType("VEC2").setArray(new Float32Array(uvAttr.array)).setBuffer(buf)
    )
    .setAttribute(
      "JOINTS_0",
      outDoc.createAccessor(`${name}_joints`).setType("VEC4").setArray(jointsArr).setBuffer(buf)
    )
    .setAttribute(
      "WEIGHTS_0",
      outDoc.createAccessor(`${name}_weights`).setType("VEC4").setArray(weightsArr).setBuffer(buf)
    );

  gltfMesh.addPrimitive(prim);
  totalVerts += vCount;
  totalTriangles += vCount / 3;
}

const skinnedNode = outDoc.createNode("AstronautSkinnedMesh").setMesh(gltfMesh).setSkin(skin);
rootNode.addChild(skinnedNode);

outDoc.createExtension(EXTTextureWebP).setRequired(true);

await outDoc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.48, error: 0.002 }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" })
);

fs.mkdirSync(path.dirname(OUT_GLB_PATH), { recursive: true });
await io.write(OUT_GLB_PATH, outDoc);

// Verify post-compression triangle & vertex counts directly from written GLB
const checkDoc = await io.read(OUT_GLB_PATH);
const postStats = checkDoc.getRoot().listMeshes()[0].listPrimitives().map((p, idx) => ({
  idx,
  mat: p.getMaterial()?.getName(),
  verts: p.getAttribute("POSITION")?.getCount(),
  tris: (p.getIndices()?.getCount() || 0) / 3,
}));

const finalBytes = fs.readFileSync(OUT_GLB_PATH);
const finalSha256 = crypto.createHash("sha256").update(finalBytes).digest("hex");

console.log({
  rawSourceBytes: rawBytes.length,
  rawSourceSha256: rawSha256,
  outputPath: OUT_GLB_PATH,
  outputBytes: finalBytes.length,
  outputMB: +(finalBytes.length / (1024 * 1024)).toFixed(3),
  outputSha256: finalSha256,
  preWeldVerts: totalVerts,
  preWeldTris: Math.round(totalTriangles),
  postCompressPrims: postStats,
  postCompressTrisTotal: postStats.reduce((s, p) => s + p.tris, 0),
  normalWebpKB: +(normalWebp.length / 1024).toFixed(1),
  ormWebpKB: +(ormWebp.length / 1024).toFixed(1),
});
