import { useGLTF } from "@react-three/drei";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import type { WebGLRenderer } from "three";
import type { QualityTier } from "@/lib/store";

let decodersConfigured = false;
let sharedKtx2Loader: KTX2Loader | null = null;

/**
 * Configures compressed geometry (Draco) and GPU-compressed texture (KTX2/BasisU) decoders
 * for optional external assets while prioritizing zero-byte procedural geometry synthesis.
 */
export function configureCompressedAssetPipeline(gl?: WebGLRenderer) {
  if (typeof window === "undefined") return;

  if (!decodersConfigured) {
    useGLTF.setDecoderPath("/decoders/draco/");
    decodersConfigured = true;
  }

  if (gl && !sharedKtx2Loader) {
    sharedKtx2Loader = new KTX2Loader();
    sharedKtx2Loader.setTranscoderPath("/decoders/basis/");
    sharedKtx2Loader.detectSupport(gl);
  }
}

export interface GpuCapabilityProfile {
  supported: boolean;
  softwareRenderer: boolean;
  initialTier: QualityTier;
}

/**
 * Inspects browser WebGL support, device memory, hardware concurrency, and renderer string
 * to pick an optimal initial quality tier before the rolling FPS watchdog takes over.
 */
export function detectGpuCapabilities(): GpuCapabilityProfile {
  if (typeof window === "undefined") {
    return { supported: true, softwareRenderer: false, initialTier: "high" };
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { powerPreference: "high-performance" }) ||
      canvas.getContext("webgl");

    if (!gl) {
      return { supported: false, softwareRenderer: false, initialTier: "low" };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase()
      : "";

    const isSoftware =
      renderer.includes("swiftshader") ||
      renderer.includes("llvmpipe") ||
      renderer.includes("software") ||
      renderer.includes("basic render");

    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    const isMobileViewport = window.innerWidth < 768;

    if (isSoftware) {
      return { supported: true, softwareRenderer: true, initialTier: "low" };
    }

    if (isMobileViewport || cores <= 4 || memory <= 4) {
      return { supported: true, softwareRenderer: false, initialTier: "medium" };
    }

    return { supported: true, softwareRenderer: false, initialTier: "high" };
  } catch {
    return { supported: false, softwareRenderer: false, initialTier: "low" };
  }
}
