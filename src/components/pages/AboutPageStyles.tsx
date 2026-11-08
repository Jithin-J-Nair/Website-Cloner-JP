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
    #about .about-source-recognition { position: relative; isolation: isolate; overflow: hidden; padding: 17vw 5vw 13vw; background: #000302; color: #f5f6f5; }
    #about .about-source-monument { pointer-events: none; position: absolute; inset: 0; z-index: -1; overflow: hidden; }
    #about .about-source-monument > div { transform: translateY(calc(var(--recognition-progress, 0) * -30vw)); }
    #about .about-source-monument span { position: relative; display: block; font-size: 25.8vw; line-height: .96; letter-spacing: -.055em; white-space: nowrap; color: transparent; -webkit-text-stroke: 1px #ffffff18; }
    #about .about-source-monument .is-slanted { font-style: italic; }
    #about .about-source-monument span::selection { background: transparent; }
    #about .about-source-monument span::after {
      content: attr(data-word); position: absolute; inset: 0; color: transparent;
      -webkit-text-stroke: 1.5px #d9ecff;
      mask-image: radial-gradient(ellipse 5vw 4vw at var(--foil-x,-1000px) var(--foil-y,-1000px), #000, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 5vw 4vw at var(--foil-x,-1000px) var(--foil-y,-1000px), #000, transparent 75%);
      filter: drop-shadow(.7px 0 #ffae81) drop-shadow(-.7px 0 #79bfff);
      opacity: var(--foil-active,0); transition: opacity .35s ease;
    }
    #about #about-recognition-window { outline-offset: 14px; scroll-margin-top: 16vh; }
    #about .about-source-record { display: grid; grid-template-columns: 1fr 1fr; column-gap: 0; row-gap: 1.8vw; margin-bottom: 6.3vw; }
    #about .about-source-record:last-child { margin-bottom: 0; }
    #about .about-source-record h2 { font-size: 3.8vw; font-weight: 400; line-height: 1; letter-spacing: -.035em; }
    #about .about-source-record-count { display: flex; align-items: center; gap: 1.5vw; font-size: 2vw; font-weight: 400; }
    #about .about-recognition-mark { flex: none; width: 2.5vw; height: 2.5vw; }
    #about .about-source-record-data { grid-column: 2; font-size: clamp(12px,1.15vw,21px); line-height: 1.65; }
    #about .about-source-award-group { display: grid; grid-template-columns: 37% 63%; position: relative; padding-block: .8vw; }
    #about .about-source-award-group::before { content: ""; position: absolute; top: 0; left: -50vw; width: 100vw; height: 1px; background: #ffffff12; pointer-events: none; }
    #about .about-source-award-group h3 { font-size: inherit; font-weight: 400; }
    #about .about-source-award-group li { display: grid; grid-template-columns: 24% 76%; }
    #about .about-source-count { font-family: var(--font-mono),monospace; font-size: .87em; }
    #about .about-source-articles a { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-block: .18vw; }
    #about .about-source-articles a:hover { text-decoration: underline; }
    #about .about-source-articles a > span { opacity: 0; transition: opacity .2s; }
    #about .about-source-articles a:hover > span, #about .about-source-articles a:focus-visible > span { opacity: 1; }
    #about .about-source-talks li { display: flex; justify-content: space-between; gap: 24px; padding-block: .2vw; }
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
          #about .about-source-recognition { padding: 20vw 5vw 12vw; }
      #about .about-narrative-layout #about-who-desc-top, #about .about-narrative-layout #about-who-desc-bottom { font-size: clamp(20px,4.6vw,35px); }
      #about .about-narrative-layout #about-who-desc-top { top: 10vh; }
      #about .about-narrative-layout #about-who-desc-bottom { bottom: 12vh; }
      #about .about-source-record { column-gap: 0; row-gap: 6vw; margin-bottom: 18vw; }
      #about .about-source-record h2 { font-size: 8vw; }
      #about .about-source-record-count { justify-content: flex-end; font-size: 4vw; gap: 3vw; }
      #about .about-recognition-mark { width: 6vw; height: 6vw; }
      #about .about-source-record-data { grid-column: 1 / -1; font-size: 12px; }
      #about .about-source-award-group { grid-template-columns: 29% 71%; padding-block: 3vw; }
      #about .about-source-award-group::before { left: -5vw; }
      #about .about-source-award-group li { grid-template-columns: 20% 80%; }
      #about .about-source-monument span { font-size: 32vw; line-height: 1.5; }
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
      #about .about-source-monument > div { transform: none; }
      #about .about-source-monument span::after { animation: none; }
      #about .about-team-cursor { display: none; }
    }
  `}</style>;
}
