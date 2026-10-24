"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useStudioStore } from "@/lib/store";

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useStudioStore((s) => s.isTransitioning);
  
  useEffect(() => {
    if (!isTransitioning || !containerRef.current) return;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    containerRef.current.appendChild(renderer.domElement);
    
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          p.x *= uResolution.x / uResolution.y;
          float r = length(p);
          float ring = smoothstep(0.0, 0.1, r - uTime * 2.5) * smoothstep(0.4, 0.3, r - uTime * 2.5);
          gl_FragColor = vec4(1.0, 1.0, 1.0, ring);
        }
      `
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    let req: number;
    let t = 0;
    let lastTime = performance.now();
    const animate = () => {
      req = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      t += dt;
      material.uniforms.uTime.value = t;
      renderer.render(scene, camera);
    };
    animate();
    
    const container = containerRef.current;
    
    return () => {
      cancelAnimationFrame(req);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container?.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isTransitioning]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
