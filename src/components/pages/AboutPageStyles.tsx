/** Route-owned overrides: no Home, shared-footer or global stylesheet edits. */
export function AboutPageStyles() {
  return <style>{`
    #about { --about-blue: #3733e8; background: #000302; }
    #about > div:first-of-type, #about #about-who, #about #about-who > .sticky, #about #about-clients { background-color: #000302; }
    #about .about-narrative-layout #about-who-desc-top { position: absolute; left: 0; top: 2vh; text-align: left; font-size: 3.85vw; }
    #about .about-narrative-layout #about-who-desc-bottom { position: absolute; right: 0; bottom: 1vh; max-width: 100%; text-align: right; font-size: 3.85vw; }
    #about #about-clients { background-color: #000302; }
    #about #about-clients { border-top: 0; padding-top: 8vw; padding-bottom: 8vw; }
    #about #about-clients h2 { font-size: 3.85vw; letter-spacing: -.04em; line-height: 1; }
    #about #about-clients .about-client-marquee-stack { margin-top: 3.8vw; gap: 0; }
    #about #about-clients .about-client-logo-tile { height: 14vw; }
    #about .about-client-logo-art { display: block; width: 100%; height: 100%; object-fit: contain; }
    #about .about-source-recognition { --record-left: 0px; --record-org: 30vw; --record-pad: 15px; position: relative; isolation: isolate; overflow: clip; padding: clamp(30px,4vw,50px) 0; min-height: 130.208333vw; display: flex; flex-direction: column; justify-content: center; background: #000302; color: #f5f6f5; font-size: clamp(12px,1vw,28px); }
    #about .about-source-monument { pointer-events: none; position: absolute; inset: 0; z-index: -1; }
    #about .about-source-monument > img { position: absolute; top: 0; left: 0; width: 150%; max-width: none; height: auto; }
    #about .about-recognition-paint { position: absolute; inset: 0; }
    #about .about-recognition-paint canvas { position: sticky; top: 0; display: block; width: 100%; height: 100vh; opacity: 0; }
    #about [data-recognition-state="ready"] .about-recognition-paint canvas { opacity: 1; }
    #about [data-recognition-state="ready"] .about-source-monument > img { visibility: hidden; }
    #about #about-recognition-window { display: flex; flex-direction: column; gap: 10vh; outline-offset: -4px; scroll-margin-top: 16vh; }
    #about .about-source-record { min-width: 0; }
    #about .about-recognition-header { position: relative; margin-bottom: 3em; padding-inline: var(--record-pad); }
    #about .about-source-record h2 { font-size: 4em; font-weight: 400; line-height: 1; letter-spacing: -.035em; overflow: hidden; }
    #about [data-recognition-char], #about [data-recognition-word] { display: inline-block; transform-origin: left bottom; }
    #about .about-recognition-word-clip { display: inline-block; overflow: hidden; vertical-align: top; white-space: pre; }
    #about .about-source-record-count { position: absolute; top: 1em; right: var(--record-pad); display: flex; align-items: center; gap: 2em; font-weight: 400; }
    #about [data-recognition-number] { font-family: var(--font-mono),monospace; font-size: 2em; line-height: 1.2; overflow: hidden; }
    #about .about-recognition-mark { flex: none; width: 2.25em; height: 2.25em; }
    #about .about-source-record-data { position: relative; padding-inline: var(--record-pad); line-height: 1.15; }
    #about .about-source-award-group { display: grid; grid-template-columns: var(--record-org) minmax(0,1fr); position: relative; margin-left: var(--record-left); margin-bottom: 2em; }
    #about .about-recognition-line { position: absolute; top: -1em; left: calc(-1 * (var(--record-pad) + var(--record-left))); width: 100vw; height: .0625em; background: #fff; opacity: .2; transform-origin: left; pointer-events: none; }
    #about .about-source-award-group h3 { font-size: 1.25em; font-weight: 400; }
    #about .about-source-award-group ul { margin-left: 2.5em; }
    #about .about-source-award-group li { display: grid; grid-template-columns: calc(3ch + 3em) minmax(0,1fr); font-size: 1.25em; }
    #about .about-source-award-group li + li { margin-top: .64em; }
    #about .about-source-count { font-family: var(--font-mono),monospace; font-size: 1em; }
    #about .about-source-articles, #about .about-source-talks { margin-left: var(--record-left); margin-bottom: 2em; }
    #about .about-source-articles > .about-recognition-line, #about .about-source-talks > .about-recognition-line { left: calc(-1 * var(--record-left)); }
    #about .about-source-articles li + li { margin-top: .5em; }
    #about .about-source-talks li + li { margin-top: .64em; }
    #about .about-source-articles a { position: relative; display: block; width: 100%; max-width: 100%; font-size: 1.25em; overflow: hidden; }
    #about .about-recognition-link-title { display: inline-block; transition: transform .4s cubic-bezier(.4,0,.1,1); }
    #about .about-recognition-link-arrow { position: absolute; top: 0; left: 0; transform: translateX(-1.3em); transition: transform .4s cubic-bezier(.4,0,.1,1); }
    #about .about-source-articles a:hover .about-recognition-link-title, #about .about-source-articles a:focus-visible .about-recognition-link-title { transform: translateX(1.3em); }
    #about .about-source-articles a:hover .about-recognition-link-arrow, #about .about-source-articles a:focus-visible .about-recognition-link-arrow { transform: translateX(0); }
    #about .about-source-talks li { display: grid; grid-template-columns: calc(var(--record-org) + 9.5em) minmax(0,1fr); gap: .5em; font-size: 1.25em; opacity: .2; text-decoration: line-through; }
    @media (min-width:401px) { #about .about-source-recognition { --record-pad: 25px; } }
    @media (min-width:813px) { #about .about-source-recognition { --record-pad: max(5vw,40px); } }
    @media (min-width:1001px) {
      #about .about-source-recognition { --record-left: 44vw; --record-org: 15vw; }
      #about .about-source-record-count { right: auto; left: calc(var(--record-pad) + var(--record-left)); }
      #about .about-source-award-group li { grid-template-columns: calc(3ch + 4em) minmax(0,1fr); }
    }
    @media (max-width:480px) {
      #about .about-source-recognition { font-size: 2.7vw; }
      #about .about-source-talks li { grid-template-columns: calc(35vw + 4em) minmax(0,1fr); }
    }
    #about .about-card-back-art { filter: url(#about-card-back-colors); }
    #about .about-card-back { box-shadow: inset 0 0 0 2px #fff; }
    #about .about-playing-expertise { --about-expertise-blue: var(--about-blue); }
    #about .about-expertise-stage { background: var(--about-blue); }
    #about .about-expertise-flourish { right: 0; width: 100%; }
    #about .about-expertise-stage { perspective: 950px; }
    #about .about-expertise-heading h2 { font-size: 12vw; line-height: .92; }
    #about .about-expertise-caption { top: 0; }
    @media (min-width:1000px) {
      #about .about-expertise-caption { width: 21.3vw; }
      #about .about-expertise-caption p { font-size: .9vw; }
      #about .about-expertise-controls { gap: .8vw; }
      #about .about-expertise-controls button { width: 2.9vw; height: 3.2vw; }
      #about .about-expertise-controls .about-card-glyph { width: 1vw; height: 1.2vw; }
    }
    #about .about-who-team-overlay { padding-top: max(7rem, calc(var(--base-padding-y) + clamp(1rem,1vw,1.5rem) * 2.8 + 2rem)); }
    @media (min-width:820px) {
      #about .about-who-team-overlay { padding-top: max(10rem, calc(var(--base-padding-y) + clamp(1rem,1vw,1.5rem) * 2.8 + 2rem)); }
    }
    #about .about-team-selector button > span { width: 2px; height: 5px; border-radius: 0; }
    #about .about-team-selector > span { display: none; }
    #about .about-team-cursor { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: clamp(112px,9.2vw,160px); height: clamp(112px,9.2vw,160px); border-radius: 50%; color: white; background: #4330f5; font-size: clamp(40px,3.2vw,54px); font-weight: 300; pointer-events: none; opacity: 0; will-change: transform; z-index: 40; }
    #about #end-section, #about #end-section > div, #about #end-section-outer { background: var(--about-blue) !important; }
    #about #end-section-outer { user-select: none; -webkit-user-select: none; touch-action: pan-y; }
    #about #end-section-content { left: 50%; right: auto; top: calc(50% - 3em); width: 100%; font-size: clamp(14px,1vw,32px); transform: translate(-50%,-50%); }
    #about #end-section-subtitle-text { font-size: 1em; line-height: 1.4; letter-spacing: -.025em; max-width: none; }
    #about #end-section-title { margin: .4em auto 0; font-size: 10vw; line-height: 1; }
    #about #end-section-title-link { font-size: inherit; line-height: 1; font-weight: 400; letter-spacing: -.006em; }
    #about .about-cta-line { display: inline-block; position: relative; height: 1em; vertical-align: top; }
    #about .about-cta-line:last-child { bottom: .02em; }
    #about .about-cta-word { display: inline-block; vertical-align: top; }
    #about .about-cta-letter-clip { display: inline-block; position: relative; height: 1em; overflow: hidden; vertical-align: top; }
    #about .about-cta-letter-track { display: block; position: relative; height: 1em; top: -.2em; will-change: transform; }
    #about .about-cta-letter { display: block; height: 1em; line-height: 1; }
    #about .about-cta-letter-copy { position: absolute; top: 100%; left: 0; }
    #about .about-cta-decoration { position: absolute; height: .07em; background: white; transform: scaleX(0); transform-origin: left; pointer-events: none; }
    #about #end-section-title-top-decoration { left: .05em; top: .85em; width: calc(100% - .05em); }
    #about #end-section-title-bottom-left-decoration { left: .25em; bottom: .1em; width: .82em; }
    #about #end-section-title-bottom-right-decoration { left: 1.78em; bottom: .1em; width: 2.45em; }
    #about .about-cta-title:focus-visible .about-cta-decoration { transform: scaleX(1) !important; }
    #about #end-section-content-crosses { inset: 21vh auto auto 20.5%; width: 59%; height: 56vh; }
    #about .end-section-content-cross { position: absolute; left: 0; top: 0; }
    #about .end-section-content-cross:nth-child(2) { left: auto; right: 0; }
    #about .end-section-content-cross:nth-child(3) { top: auto; bottom: 0; }
    #about .end-section-content-cross:nth-child(4) { top: auto; bottom: 0; left: calc(50% - .5rem); }
    #about .end-section-content-cross:nth-child(5) { top: auto; bottom: 0; left: auto; right: 0; }
    #about #end-bottom { min-width: clamp(238px,16.5vw,320px); height: clamp(54px,3.7125vw,76px); bottom: 7vh; }
    #about .about-cta-pill-arrow { position: relative; width: 1em; height: 1em; overflow: hidden; }
    #about .about-cta-pill-arrow > span { display: block; height: 1em; animation: about-cta-arrow 3s cubic-bezier(.1,0,.1,1) infinite; }
    #about .about-cta-pill-arrow:last-child > span { animation-delay: .3s; }
    #about .about-cta-pill-label { display: block; position: relative; animation: about-cta-ticker 3s .2s cubic-bezier(.1,0,.1,1) infinite; }
    #about .about-cta-pill-label > span { display: block; }
    #about .about-cta-pill-label > span:last-child { position: absolute; top: -100%; left: 0; }
    @keyframes about-cta-arrow { 0% { transform: translateY(-100%); } 33%,100% { transform: translateY(0); } }
    @keyframes about-cta-ticker { 0% { transform: translateY(0); } 33%,100% { transform: translateY(100%); } }
    @media (min-aspect-ratio:21/9) { #about #end-section-title { font-size: 6.7vw; } }
    @media (prefers-reduced-motion:reduce) {
      #about .about-cta-pill-arrow > span, #about .about-cta-pill-label { animation: none; }
      #about .about-cta-pill-label > span:last-child { display: none; }
      #about .about-cta-letter-track { will-change: auto; }
    }
    #about .about-card-front li { border-bottom: 0; background-image: radial-gradient(circle, #dedede 1px, transparent 1.5px); background-size: 8px 3px; background-position: 0 100%; background-repeat: repeat-x; }
    #about .about-card-front li:last-child { background-image: none; }
    @media (min-width:820px) {
      #about #about-clients h2 { white-space: nowrap; }
      #about #about-clients > .grid p { text-align: right; justify-self: end; max-width: 26ch; margin-left: auto; font-size: .85vw; line-height: 1.25; letter-spacing: -.01em; }
      #about .about-who-team-overlay { padding-top: 16vh; }
      #about [data-team-hud-title] { font-size: 5.2vw; }
      #about [data-team-ruler] { letter-spacing: .36em; }
      #about #about-who-team-name { font-size: 1vw; }
      #about #about-who-team-desc-text { font-size: .85vw; line-height: 1.4; max-width: 33ch; }
      #about .about-team-progress { width: 12.5vw; }
      #about .about-who-team-overlay > div:last-child > div:last-child { gap: 5.8vw; }
    }
    @media (prefers-reduced-motion:reduce) {
      #about #about-clients .about-client-logo-tile { height: 14vw; }
    }
    @media (hover: hover) and (pointer: fine) {
      #about .about-who-team-overlay[data-team-active="true"] { cursor: none; }
      #about .about-who-team-overlay button, #about .about-who-team-overlay a { cursor: pointer; }
    }
    @media (min-width:1000px) and (min-height:650px) and (prefers-reduced-motion:no-preference) {
      #about .about-playing-expertise:not([data-reduced="true"]) { height: 360svh; }
      #about .about-playing-expertise:not([data-reduced="true"]) .about-expertise-stage { overflow: clip; }
    }
    @keyframes about-client-loop-three { from { transform: translate3d(0,0,0); } to { transform: translate3d(-33.333333333%,0,0); } }
    @media (prefers-reduced-motion:no-preference) {
      #about .about-client-marquee-track { animation-name: about-client-loop-three; }
    }
    @media (min-width:820px) and (prefers-reduced-motion:no-preference) {
      #about #about-clients .about-client-marquee-stack { margin-inline: calc(-1 * var(--base-padding-x)); }
      #about #about-clients .about-client-marquee-track { width: max-content; }
      #about #about-clients .about-client-marquee-set { flex: none; width: max-content; }
      #about #about-clients .about-client-logo-tile { flex: 0 0 15vw; width: 15vw; padding: 0; }
    }
    @media (max-width:819px) {
      #about #about-clients { padding-block: 18vw; }
      #about #about-clients h2 { margin-inline: 5vw; font-size: 13.3vw; line-height: 1.15; }
      #about #about-clients > .grid p { max-width: 72vw; margin-inline: auto; text-align: center; }
      #about #about-clients .about-client-marquee-stack { margin-inline: calc(-1 * var(--base-padding-x)); }
      #about #about-clients .about-client-marquee-track { width: max-content; }
      #about #about-clients .about-client-marquee-set { flex: none; width: auto; }
      #about #about-clients .about-client-logo-tile { flex: 0 0 33.333333vw; width: 33.333333vw; }
      #about #about-clients .about-client-logo-tile { height: 28vw; }
      #about .about-narrative-layout #about-who-desc-top, #about .about-narrative-layout #about-who-desc-bottom { font-size: clamp(20px,4.6vw,35px); }
      #about .about-narrative-layout #about-who-desc-top { top: 10vh; }
      #about .about-narrative-layout #about-who-desc-bottom { bottom: 12vh; }
      #about .about-expertise-heading h2 { font-size: 14vw; line-height: 1.05; }
      #about #end-section-title { font-size: 19.5vw; }
      #about #end-section-content { top: 40%; }
      #about #end-section-subtitle-text { max-width: 55%; font-size: 1.2em; white-space: normal; }
      #about #end-bottom { min-width: 228px; }
      #about #end-section-content-crosses { left: 8%; right: auto; width: 84%; }
    }
    @media (max-width:819px) and (prefers-reduced-motion:reduce) {
      #about #about-clients .about-client-marquee-track { width: 100%; }
      #about #about-clients .about-client-marquee-set { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; flex: 0 0 100%; }
      #about #about-clients .about-client-marquee-set[aria-hidden="true"] { display: none; }
      #about #about-clients .about-client-logo-tile { width: 100%; }
    }
    @media (prefers-reduced-motion:reduce) {
      #about .about-recognition-link-title, #about .about-recognition-link-arrow { transition: none; }
      #about .about-team-cursor { display: none; }
    }
  `}</style>;
}
