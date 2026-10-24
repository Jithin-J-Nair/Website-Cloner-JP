"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TEAM_MEMBERS } from "@/data/studio";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";

interface AboutTeamSectionProps {
  compactCta?: boolean;
}

export function AboutTeamSection({ compactCta = false }: AboutTeamSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const member = TEAM_MEMBERS[activeIndex] ?? TEAM_MEMBERS[0];

  const step = (dir: -1 | 1) => {
    const next = (activeIndex + dir + TEAM_MEMBERS.length) % TEAM_MEMBERS.length;
    setActiveIndex(next);
    soundEngine.playChime(523.25 + next * 40, 0.06);
  };

  return (
    <SurfaceSection
      id="about-team"
      surface="ice"
      webglMode="about-sculpture"
      ariaLabel="Studio leadership and multidisciplinary specialists"
      className="py-24 md:py-36"
    >
      <div className="kn-container">
        <CrosshairRow
          labelLeft="06 // THE COLLECTIVE"
          labelRight={`SPECIALISTS [[ 00${activeIndex + 1} / 00${TEAM_MEMBERS.length} ]]`}
        />

        <div className="mt-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="kn-eyebrow text-[#2434ff]">• MULTIDISCIPLINARY MINDS</p>
            <SplitTextReveal
              as="h2"
              lines={[
                "Senior artists, shader authors,",
                "and systems engineers working as one.",
              ]}
              className="kn-statement mt-3 text-[#0a0c12]"
            />
          </div>

          {compactCta && (
            <MagneticPill
              href="/about"
              transitionLabel="ABOUT KINETA"
              variant="dark"
              size="md"
              cursorText="STUDIO STORY"
            >
              Full Studio Story
            </MagneticPill>
          )}
        </div>

        {/* Interactive Specialist Deck */}
        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Active Spotlight Card (`[[ 001 ]]` Lusion Signature Pattern) */}
          <div className="lg:col-span-6">
            <div className="flex h-full flex-col justify-between rounded-[30px] border border-black/10 bg-[#0b0e17] p-8 text-[#f4f6fb] shadow-2xl md:p-10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm tracking-widest text-[#00d2ff]">
                  [[ {member.index} ]]
                </span>
                <span className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1 font-mono text-xs text-white/80">
                  {member.location}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.24 } }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.16 } }}
                  className="my-10"
                >
                  {/* Procedural Geometric Emblem Portrait */}
                  <div
                    className="mb-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${member.accent}, #090b10 80%)`,
                    }}
                  >
                    <span className="font-display text-3xl font-semibold text-white">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>

                  <h3 className="font-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                    {member.name}
                  </h3>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.09em] text-[#7d89ff]">
                    {member.role}
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-[#c2cbde]">{member.bio}</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between border-t border-white/10 pt-5">
                <span className="font-mono text-xs uppercase tracking-widest text-[#9aa3b8]">
                  SELECT OR STEP SPECIALIST
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous team member"
                    className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-[#2434ff]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next team member"
                    className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-[#2434ff]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Roster Index */}
          <div className="flex flex-col justify-between gap-3 lg:col-span-6" role="tablist">
            {TEAM_MEMBERS.map((person, idx) => {
              const selected = idx === activeIndex;
              return (
                <button
                  key={person.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onMouseEnter={() => {
                    if (activeIndex !== idx) {
                      setActiveIndex(idx);
                      soundEngine.playHoverTick();
                    }
                  }}
                  onClick={() => {
                    setActiveIndex(idx);
                    soundEngine.playChime(554.37, 0.06);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-[22px] border px-6 py-4 text-left transition-all duration-250 ${
                    selected
                      ? "border-[#2434ff] bg-white shadow-[0_14px_34px_-12px_rgba(36,52,255,0.28)]"
                      : "border-black/10 bg-white/65 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-semibold text-[#2434ff]">
                      [[ {person.index} ]]
                    </span>
                    <div>
                      <p className="font-display text-lg font-medium text-[#0a0c12]">
                        {person.name}
                      </p>
                      <p className="text-xs text-[#4a5165]">{person.role}</p>
                    </div>
                  </div>
                  <span className="hidden font-mono text-xs text-[#4a5165] sm:inline">
                    {person.location}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SurfaceSection>
  );
}
