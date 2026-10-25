"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

type ShaderAnimationProps = {
  className?: string
  speed?: number            // 1 = original speed
  paused?: boolean
  tint?: [number, number, number] // multiplies the output color; [1,1,1] = original
  maxDpr?: number
}

const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 tint;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.05;
    float lineWidth = 0.002;
    vec3 color = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
      }
    }
    gl_FragColor = vec4(color * tint, 1.0);
  }
`

export function ShaderAnimation({
  className = "h-full w-full",
  speed = 1,
  paused = false,
  tint = [1, 1, 1],
  maxDpr = 2,
}: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const speedRef = useRef(speed)
  const tintRef = useRef(tint)

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { tintRef.current = tint }, [tint])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      tint: { value: new THREE.Vector3(1, 1, 1) },
    }
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG })
    scene.add(new THREE.Mesh(geometry, material))

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
    const canvas = renderer.domElement
    canvas.style.cssText = "display:block;width:100%;height:100%"
    canvas.setAttribute("aria-hidden", "true")
    container.appendChild(canvas)

    const resize = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      renderer.setSize(w, h, false)
      uniforms.resolution.value.set(canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(container)

    let raf = 0
    let last = performance.now()
    let elapsed = 1 / 3 // matches the original starting value of 1.0 after x3
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (pausedRef.current || !visible || document.visibilityState === "hidden") return
      elapsed += dt * speedRef.current
      uniforms.time.value = elapsed * 3.0
      const [r, g, b] = tintRef.current
      uniforms.tint.value.set(r, g, b)
      renderer.render(scene, camera)
    }
    if (reduce) {
      uniforms.time.value = 6.0
      renderer.render(scene, camera)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf) }
    const onRestored = () => { if (!reduce) { last = performance.now(); raf = requestAnimationFrame(frame) } }
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (canvas.parentNode === container) container.removeChild(canvas)
    }
  }, [maxDpr])

  return <div ref={containerRef} className={className} style={{ background: "#000", overflow: "hidden" }} />
}
