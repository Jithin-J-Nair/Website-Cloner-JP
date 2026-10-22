"use client";

import React from "react";
import { AWARDS_LEDGER, CLIENT_PARTNERS } from "@/data/studio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";

export function ClientsAwardsSection() {
  const rowA = CLIENT_PARTNERS.slice(0, 6);
  const rowB = CLIENT_PARTNERS.slice(6, 12);

  return (
    <SurfaceSection
      id="recognition"
      surface="ice"
      webglMode="about-sculpture"
      ariaLabel="Partner brands and international recognition"
      className="py-24 md:py-36"
    >
      <div className="kn-container">
        <CrosshairRow
          labelLeft="05 // PARTNERS & RECOGNITION"
          labelRight="64 INTERNATIONAL HONORS"
        />

        {/* Partner Header */}
        <div className="mt-10 max-w-2xl">
          <p className="kn-eyebrow text-[#2434ff]">• BRANDS WE PARTNER WITH</p>
          <SplitTextReveal
            as="h2"
            lines={["Trusted by pioneering", "engineering & brand teams."]}
            className="kn-statement mt-3 text-[#0a0c12]"
          />
        </div>
      </div>

      {/* Dual Infinite Partner Marquee */}
      <div className="kn-marquee-wrap mt-12 space-y-4 overflow-hidden py-2">
        {/* Forward Track */}
        <div className="kn-marquee-track gap-4">
          {[...rowA, ...rowA, ...rowA, ...rowA].map((partner, idx) => (
            <div
              key={`a-${partner.name}-${idx}`}
              aria-hidden={idx >= rowA.length ? true : undefined}
              className="flex h-20 w-60 shrink-0 items-center justify-between rounded-[22px] border border-black/10 bg-white/85 px-6 shadow-[0_8px_24px_-12px_rgba(9,11,16,0.12)] backdrop-blur-md"
            >
              <span className="font-mono text-xs font-bold tracking-widest text-[#2434ff]">
                [{partner.glyph}]
              </span>
              <span className="font-display text-base font-medium tracking-tight text-[#0a0c12]">
                {partner.name}
              </span>
            </div>
          ))}
        </div>

        {/* Reverse Track */}
        <div className="kn-marquee-track-reverse gap-4">
          {[...rowB, ...rowB, ...rowB, ...rowB].map((partner, idx) => (
            <div
              key={`b-${partner.name}-${idx}`}
              aria-hidden={idx >= rowB.length ? true : undefined}
              className="flex h-20 w-60 shrink-0 items-center justify-between rounded-[22px] border border-black/10 bg-white/85 px-6 shadow-[0_8px_24px_-12px_rgba(9,11,16,0.12)] backdrop-blur-md"
            >
              <span className="font-mono text-xs font-bold tracking-widest text-[#0a0c12]/60">
                [{partner.glyph}]
              </span>
              <span className="font-display text-base font-medium tracking-tight text-[#0a0c12]">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Structured 64-Honor Awards Ledger */}
      <div className="kn-container mt-20 md:mt-28">
        <div className="grid gap-12 border-t border-black/12 pt-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-start gap-3">
              <h3 className="font-display text-4xl font-medium tracking-tight text-[#0a0c12] md:text-5xl">
                Awards
              </h3>
              <span className="mt-1 rounded-full bg-[#2434ff] px-3 py-0.5 font-mono text-xs font-semibold text-white">
                64
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#4a5165]">
              Recognized globally for visual craft, real-time shader innovation, and accessible web
              engineering.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            {AWARDS_LEDGER.map((group) => (
              <div
                key={group.jury}
                className="rounded-[24px] border border-black/10 bg-white/80 p-6 backdrop-blur-md"
              >
                <p className="font-display text-lg font-semibold text-[#0a0c12]">{group.jury}</p>
                <ul className="mt-4 divide-y divide-black/8">
                  {group.items.map((item) => (
                    <li
                      key={item.title}
                      className="group flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="text-[#4a5165] transition-colors group-hover:text-[#0a0c12]">
                        {item.title}
                      </span>
                      <span className="rounded-md bg-[#eef0f6] px-2.5 py-0.5 font-mono text-xs font-medium text-[#0a0c12] transition-colors group-hover:bg-[#2434ff] group-hover:text-white">
                        {item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SurfaceSection>
  );
}
