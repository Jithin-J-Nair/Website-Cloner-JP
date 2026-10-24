"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Globe } from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/tokens";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { StudioFooter } from "@/components/sections/StudioFooter";

const SCOPE_OPTIONS = [
  "3D Interactive Website",
  "Product Launch Campaign",
  "Custom GLSL / WebGPU R&D",
  "Design System & Motion",
  "WebXR / Installation",
];

const BUDGET_TIERS = ["$50K – $90K", "$90K – $160K", "$160K – $250K+", "Advisory / R&D Sprint"];

const FAQ_ITEMS = [
  {
    q: "How early should we bring Lusion into a product or brand launch?",
    a: "Ideally 8 to 14 weeks before launch. Bringing creative direction and shader prototyping together early lets us shape narrative and engineering around a single big interactive idea without last-minute compromises.",
  },
  {
    q: "Do your 3D experiences maintain fast load times and SEO on mobile?",
    a: "Yes. Critical typography and semantic markup render immediately on the server (LCP < 1.8s), while procedural geometry, DPR clamping, and our rolling FPS watchdog keep mobile devices smooth and responsive.",
  },
  {
    q: "Can you partner directly alongside our internal engineering or brand team?",
    a: "Frequently. Half of our engagements are end-to-end turnkey launches, and half embed seamlessly alongside internal product engineering teams with shared TypeScript components and design tokens.",
  },
];

export function ContactPageView() {
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["3D Interactive Website"]);
  const [budget, setBudget] = useState<string>(BUDGET_TIERS[1]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [brief, setBrief] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clocks, setClocks] = useState({ osaka: "--:--", bristol: "--:--", nyc: "--:--" });

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      const fmt = (timeZone: string) =>
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone,
        }).format(now);
      setClocks({
        osaka: fmt("Asia/Tokyo"),
        bristol: fmt("Europe/London"),
        nyc: fmt("America/New_York"),
      });
    };
    updateClocks();
    const id = window.setInterval(updateClocks, 1000);
    return () => window.clearInterval(id);
  }, []);

  const toggleScope = (scope: string) => {
    soundEngine.playHoverTick();
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((item) => item !== scope) : [...prev, scope]
    );
  };

  const handleCopy = async (key: string, address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      soundEngine.playChime(783.99, 0.08);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2400);
    } catch {
      window.open(`mailto:${address}`, "_self");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes("@") || !brief.trim()) return;
    soundEngine.playChime(880, 0.11);
    setSubmitted(true);
  };

  return (
    <div className="w-full">
      <SurfaceSection
        surface="ice"
        webglMode="contact-beacon"
        ariaLabel="Contact Lusion and configure project brief"
        className="pt-32 pb-24 md:pt-40 md:pb-32"
      >
        <div className="kn-container">
          <CrosshairRow
            labelLeft="CONTACT // PROJECT PLANNER"
            labelRight="PARTNER RESPONSE < 24H"
          />

          <div className="mt-10 max-w-5xl">
            <p className="kn-eyebrow text-[#2434ff]">• INITIATE DIALOGUE</p>
            <SplitTextReveal
              as="h1"
              immediate
              lines={["LET'S ARCHITECT", "YOUR NEXT LAUNCH."]}
              className="kn-hero-title mt-3 text-[#0a0c12]"
            />
          </div>

          {/* Live Global Studio Clocks Bar */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { city: "Osaka Studio", zone: "JST · UTC+9", time: clocks.osaka },
              { city: "Bristol Studio", zone: "UK · GMT/BST", time: clocks.bristol },
              { city: "New York Desk", zone: "US · ET", time: clocks.nyc },
            ].map((hub) => (
              <div
                key={hub.city}
                className="flex items-center justify-between rounded-[22px] border border-black/10 bg-white/85 px-6 py-4 backdrop-blur-md"
              >
                <div>
                  <p className="font-display text-base font-semibold text-[#0a0c12]">{hub.city}</p>
                  <p className="font-mono text-[11px] text-[#4a5165]">{hub.zone}</p>
                </div>
                <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-[#2434ff]">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {hub.time}
                </span>
              </div>
            ))}
          </div>

          {/* Main 12-Col Form + Direct Channels */}
          <div className="mt-12 grid gap-10 lg:grid-cols-12">
            {/* Interactive Project Brief Builder */}
            <div className="rounded-[32px] border border-black/10 bg-white/90 p-8 shadow-xl backdrop-blur-xl md:p-12 lg:col-span-8">
              {submitted ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="space-y-6 py-8"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#10d98c]/15 px-4 py-1.5 font-mono text-xs font-semibold uppercase text-[#0a7a4f]">
                    <Check className="h-4 w-4" /> Brief Logged — Dispatch #KN-2026
                  </span>
                  <h2 className="font-display text-3xl font-medium text-[#0a0c12] md:text-4xl">
                    Thank you, {name}. Our executive producers will respond within one business day.
                  </h2>
                  <div className="rounded-2xl border border-black/10 bg-[#eef0f6] p-6 font-mono text-xs space-y-2 text-[#0a0c12]">
                    <p>
                      <strong>SCOPES:</strong> {selectedScopes.join(" · ") || "Custom"}
                    </p>
                    <p>
                      <strong>INVESTMENT TIER:</strong> {budget}
                    </p>
                    <p>
                      <strong>CONTACT:</strong> {email} {company ? `(${company})` : ""}
                    </p>
                  </div>
                  <MagneticPill
                    onClick={() => {
                      setSubmitted(false);
                      setBrief("");
                    }}
                    variant="dark"
                    size="md"
                  >
                    Send Another Brief
                  </MagneticPill>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Multi-select Disciplines */}
                  <div>
                    <span className="kn-eyebrow block text-[#2434ff]">
                      01 // WHAT ARE WE BUILDING?
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {SCOPE_OPTIONS.map((scope) => {
                        const active = selectedScopes.includes(scope);
                        return (
                          <button
                            key={scope}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleScope(scope)}
                            className={`cursor-pointer rounded-full px-4 py-2 font-mono text-xs uppercase transition ${
                              active
                                ? "bg-[#2434ff] text-white shadow-md"
                                : "border border-black/12 bg-[#eef0f6] text-[#0a0c12] hover:bg-black/10"
                            }`}
                          >
                            {scope}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Investment Tier */}
                  <div>
                    <span className="kn-eyebrow block text-[#2434ff]">
                      02 // ESTIMATED PRODUCTION TIER
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {BUDGET_TIERS.map((tier) => {
                        const active = budget === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              soundEngine.playHoverTick();
                              setBudget(tier);
                            }}
                            className={`cursor-pointer rounded-full px-4 py-2 font-mono text-xs uppercase transition ${
                              active
                                ? "bg-[#0a0c12] text-white"
                                : "border border-black/12 bg-[#eef0f6] text-[#0a0c12] hover:bg-black/10"
                            }`}
                          >
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contact Inputs */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="kn-eyebrow block text-[11px] text-[#4a5165]"
                      >
                        YOUR NAME *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="mt-2 h-12 w-full rounded-2xl border border-black/14 bg-[#f7f8fc] px-4 text-sm text-[#0a0c12] focus:border-[#2434ff] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="kn-eyebrow block text-[11px] text-[#4a5165]"
                      >
                        WORK EMAIL *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="mt-2 h-12 w-full rounded-2xl border border-black/14 bg-[#f7f8fc] px-4 text-sm text-[#0a0c12] focus:border-[#2434ff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-company"
                      className="kn-eyebrow block text-[11px] text-[#4a5165]"
                    >
                      BRAND / ORGANIZATION
                    </label>
                    <input
                      id="contact-company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Robotics"
                      className="mt-2 h-12 w-full rounded-2xl border border-black/14 bg-[#f7f8fc] px-4 text-sm text-[#0a0c12] focus:border-[#2434ff] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-brief"
                      className="kn-eyebrow block text-[11px] text-[#4a5165]"
                    >
                      PROJECT GOALS &amp; TARGET LAUNCH WINDOW *
                    </label>
                    <textarea
                      id="contact-brief"
                      rows={4}
                      required
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Tell us about the experience, product story, target launch date, and key goals..."
                      className="mt-2 w-full rounded-2xl border border-black/14 bg-[#f7f8fc] p-4 text-sm text-[#0a0c12] focus:border-[#2434ff] focus:outline-none"
                    />
                  </div>

                  <MagneticPill type="submit" variant="cobalt" size="lg">
                    Transmit Project Brief
                  </MagneticPill>
                </form>
              )}
            </div>

            {/* Right Direct Email & FAQ Column */}
            <aside className="space-y-6 lg:col-span-4">
              {[
                {
                  key: "biz",
                  title: "New Business & Commissions",
                  addr: DESIGN_TOKENS.brand.emailBusiness,
                },
                {
                  key: "gen",
                  title: "Press, Speaking & General",
                  addr: DESIGN_TOKENS.brand.emailGeneral,
                },
                {
                  key: "talent",
                  title: "Careers & Shader Fellowships",
                  addr: DESIGN_TOKENS.brand.emailCareers,
                },
              ].map((channel) => (
                <div
                  key={channel.key}
                  className="rounded-[26px] border border-black/10 bg-white/85 p-6 backdrop-blur-md"
                >
                  <p className="kn-eyebrow text-[11px] text-[#4a5165]">{channel.title}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <a
                      href={`mailto:${channel.addr}`}
                      className="font-display text-lg font-medium text-[#0a0c12] hover:text-[#2434ff]"
                    >
                      {channel.addr}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(channel.key, channel.addr)}
                      aria-label={`Copy ${channel.addr}`}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-[#eef0f6] text-[#0a0c12] transition hover:bg-[#2434ff] hover:text-white"
                    >
                      {copiedKey === channel.key ? (
                        <Check className="h-4 w-4 text-[#10d98c]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Studio FAQ */}
              <div className="rounded-[26px] border border-black/10 bg-white/85 p-6 backdrop-blur-md">
                <p className="kn-eyebrow text-[#2434ff]">FREQUENT QUESTIONS</p>
                <div className="mt-4 divide-y divide-black/10">
                  {FAQ_ITEMS.map((item) => (
                    <details key={item.q} className="group py-3.5">
                      <summary className="cursor-pointer list-none font-display text-base font-medium text-[#0a0c12] group-open:text-[#2434ff]">
                        {item.q}
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-[#4a5165]">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </SurfaceSection>

      <StudioFooter nextHref="/" nextLabel="Return to Flagship Home" />
    </div>
  );
}
