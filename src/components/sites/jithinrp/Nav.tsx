"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NAV_LINKS } from "./data";
import { Signature } from "./Signature";
import { getSound, type SoundState } from "./runtime/sound";

export function Nav() {
  const [sound, setSound] = useState<SoundState>({ enabled: true, unlocked: false });

  useEffect(() => getSound().subscribe(setSound), []);

  const label = sound.enabled && sound.unlocked ? "Sound on" : sound.unlocked ? "Sound off" : "Click for sound";

  return (
    <div className="navbar">
      <header className="nav">
        <Link className="nav__brand" href="#top" aria-label="Jithin RP, home">
          <Signature />
        </Link>
        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const external = link.external || /^https?:/.test(link.href);
            if (external) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={link.label === "Resume" ? "Download resume (PDF)" : undefined}
                  data-cursor-pill={link.pill}
                >
                  {link.label}
                </a>
              );
            }
            if (link.href.startsWith("#")) return <a key={link.label} href={link.href}>{link.label}</a>;
            return (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="sound-toggle"
          type="button"
          data-sound-toggle=""
          aria-pressed={sound.enabled && sound.unlocked}
          title={sound.unlocked ? "Music and sounds (M)" : "Click anywhere to turn on music and sounds"}
          onClick={() => getSound().setEnabled(!sound.enabled)}
        >
          <svg className="sound-toggle__wave" viewBox="0 0 24 24" aria-hidden="true">
            <g className="sound-toggle__amp">
              <path
                className="sound-toggle__path"
                d="M-12 12 q3 -8 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0"
              />
            </g>
          </svg>
          <span className="sound-toggle__label">{label}</span>
        </button>
      </header>
    </div>
  );
}
