/** Route-owned overrides: no Home, shared-footer or global stylesheet edits. */
export function AboutPageStyles() {
  return <style>{`
    #about { --about-blue: #3733e8; background: #000302; }
    #about > div:first-of-type, #about #about-who, #about #about-who > .sticky,
    #about #about-clients { background-color: #000302; }
    #about #about-clients { border-top: 0; padding-top: 8vw; padding-bottom: 8vw; }
    #about #about-clients h2 { font-size: 3.55vw; letter-spacing: -.04em; line-height: 1; }
    #about #about-clients .about-client-marquee-stack { margin-top: 6vw; gap: 4.8vw; }
    #about #about-clients .about-client-logo-tile { height: 4vw; }
    #about .about-client-wordmark { font-size: clamp(16px, 1.9vw, 32px); color: white; opacity: 1; }
    #about .about-client-wordmark[data-brand="Coca-Cola"] { font-family: Georgia,serif; font-style: italic; font-weight: 700; }
    #about .about-client-wordmark[data-brand="Max Mara"], #about .about-client-wordmark[data-brand="AKQA"] { font-family: Georgia,serif; }
    #about .about-client-wordmark[data-brand="Porsche"] { text-transform: uppercase; letter-spacing: .15em; font-size: 1.25vw; }
    #about .about-client-wordmark[data-brand="Sony"], #about .about-client-wordmark[data-brand="NVIDIA"] { text-transform: uppercase; font-weight: 700; }
    #about .about-source-recognition { position: relative; isolation: isolate; overflow: hidden; padding: 17vw 5vw 12vw; background: #000302; color: #f5f6f5; }
    #about .about-source-monument { pointer-events: none; position: absolute; inset: 0; z-index: -1; overflow: hidden; }
    #about .about-source-monument > div { transform: translateY(calc(var(--recognition-progress, 0) * -30vw)); }
    #about .about-source-monument span { position: relative; display: block; font-size: 25.8vw; line-height: .96; letter-spacing: -.055em; white-space: nowrap; color: transparent; -webkit-text-stroke: 1px #ffffff18; }
    #about .about-source-monument .is-slanted { font-style: italic; }
    #about .about-source-monument span::selection { background: transparent; }
    #about .about-source-monument span::after {
      content: attr(data-word); position: absolute; inset: 0; color: transparent;
      -webkit-text-stroke: 0 transparent; background-clip: text; -webkit-background-clip: text;
      background-image: radial-gradient(ellipse 9vw 13vw at var(--foil-x,-1000px) var(--foil-y,-1000px), #fff 0%, #fff 12%, #777 30%, #000 70%),
        conic-gradient(from var(--foil-angle,30deg) at var(--foil-x,-1000px) var(--foil-y,-1000px), #e8f6ff, #348cbe 12%, #151830 20%, #ef9978 33%, #333446 42%, #d5dfe9 48%, #272a58 59%, #68cdf6 70%, #17151e 81%, #efb1a8 90%, #e8f6ff);
      background-blend-mode: multiply; mix-blend-mode: screen;
      opacity: var(--foil-active,0); transition: opacity .35s ease;
      background-repeat: no-repeat;
      animation: about-foil-shimmer 3s ease-in-out infinite;
      animation-play-state: var(--foil-play,paused);
    }
    @keyframes about-foil-shimmer {
      0%,100% { background-position: 0 0, -12px 0; }
      50% { background-position: 0 0, 12px 0; }
    }
    #about #about-recognition-window { outline-offset: 14px; scroll-margin-top: 16vh; }
    #about .about-source-record { display: grid; grid-template-columns: 1fr 1fr; column-gap: 0; row-gap: 1.8vw; margin-bottom: 6.3vw; }
    #about .about-source-record:last-child { margin-bottom: 0; }
    #about .about-source-record h2 { font-size: 3.8vw; font-weight: 400; line-height: 1; letter-spacing: -.035em; }
    #about .about-source-record-count { display: flex; align-items: center; gap: 1.5vw; font-size: 2vw; font-weight: 400; }
    #about .about-source-record-count > span { font-size: 2.5vw; }
    #about .about-source-record-data { grid-column: 2; font-size: clamp(12px,1.15vw,21px); line-height: 1.65; }
    #about .about-source-award-group { display: grid; grid-template-columns: 37% 63%; padding-block: .8vw; border-top: 1px solid #ffffff12; }
    #about .about-source-award-group h3 { font-size: inherit; font-weight: 400; }
    #about .about-source-award-group li { display: grid; grid-template-columns: 24% 76%; }
    #about .about-source-count { font-family: var(--font-mono),monospace; font-size: .87em; }
    #about .about-source-articles a { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-block: .18vw; }
    #about .about-source-articles a:hover { text-decoration: underline; }
    #about .about-source-articles a > span { opacity: 0; transition: opacity .2s; }
    #about .about-source-articles a:hover > span, #about .about-source-articles a:focus-visible > span { opacity: 1; }
    #about .about-source-talks li { display: flex; justify-content: space-between; gap: 24px; padding-block: .2vw; }
    #about .about-playing-expertise { --about-expertise-blue: var(--about-blue); }
    #about .about-expertise-studio { position: absolute; top: -16vw; left: 17vw; font-size: 26vw; line-height: 1; letter-spacing: -.055em; font-weight: 400; pointer-events: none; opacity: .9; }
    #about .about-expertise-stage { background: var(--about-blue); }
    #about .about-expertise-flourish { right: 0; width: 100%; }
    #about .about-expertise-heading h2 { font-size: 12vw; line-height: .92; }
    #about .about-expertise-caption { top: 0; }
    #about .about-team-selector button > span { width: 2px; height: 5px; border-radius: 0; }
    #about .about-team-selector > span { display: none; }
    #about .about-team-cursor { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: 104px; height: 104px; border-radius: 50%; color: white; background: #4330f5; font-size: 43px; font-weight: 300; pointer-events: none; opacity: 0; will-change: transform; z-index: 40; }
    #about #end-section, #about #end-section > div, #about #end-section-outer { background: var(--about-blue) !important; }
    #about #end-section-content { top: 20.5vh; }
    #about #end-section-title-link { font-size: 9.6vw; line-height: 1.02; font-weight: 400; }
    #about #end-bottom { min-width: 16.7vw; height: 7vh; bottom: 7vh; }
    #about .about-cta-arm { display: none; }
    @media (hover: hover) and (pointer: fine) {
      #about .about-who-team-overlay[data-team-active="true"] { cursor: none; }
      #about .about-who-team-overlay button, #about .about-who-team-overlay a { cursor: pointer; }
    }
    @media (min-width:1000px) and (min-height:650px) and (prefers-reduced-motion:no-preference) {
      #about .about-playing-expertise:not([data-reduced="true"]) { height: 360svh; }
      #about .about-playing-expertise:not([data-reduced="true"]) .about-expertise-stage { overflow: clip; }
    }
    @media (max-width:819px) {
      #about #about-clients { padding-block: 18vw; }
      #about #about-clients h2 { font-size: 8.5vw; }
      #about #about-clients .about-client-logo-tile { height: 12vw; }
      #about .about-client-wordmark { font-size: 3.2vw; }
      #about .about-client-wordmark[data-brand="Porsche"] { font-size: 2.5vw; }
      #about .about-source-recognition { padding: 20vw 5vw; }
      #about .about-source-record { column-gap: 0; row-gap: 6vw; margin-bottom: 18vw; }
      #about .about-source-record h2 { font-size: 8vw; }
      #about .about-source-record-count { justify-content: flex-end; font-size: 4vw; gap: 3vw; }
      #about .about-source-record-count > span { font-size: 6vw; }
      #about .about-source-record-data { grid-column: 1 / -1; font-size: 12px; }
      #about .about-source-award-group { grid-template-columns: 29% 71%; padding-block: 3vw; }
      #about .about-source-award-group li { grid-template-columns: 20% 80%; }
      #about .about-source-monument span { font-size: 32vw; line-height: 1.5; }
      #about .about-expertise-studio { display: none; }
      #about .about-expertise-heading h2 { font-size: 14vw; line-height: 1.05; }
      #about #end-section-title-link { font-size: 16.4vw; }
      #about #end-bottom { min-width: 228px; height: 50px; }
      #about #end-section-content-crosses { inset-inline: 8%; }
    }
    @media (prefers-reduced-motion:reduce) {
      #about .about-source-monument > div { transform: none; }
      #about .about-source-monument span::after { animation: none; }
      #about .about-team-selector button > span { width: 2px; height: 5px; border-radius: 0; }
    #about .about-team-selector > span { display: none; }
    #about .about-team-cursor { display: none; }
      #about .about-expertise-studio { display: none; }
    }
  `}</style>;
}
