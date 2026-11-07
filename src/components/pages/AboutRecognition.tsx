"use client";

import { useEffect, useRef } from "react";
import { LUSION_ABOUT } from "@/data/reference";

/** Reference-informed vectors avoid platform-dependent Unicode glyph shapes. */
function RecognitionMark({ kind }: { kind: "awards" | "articles" | "talks" }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" className="about-recognition-mark" fill="currentColor">
    {kind === "awards" ? Array.from({ length: 8 }, (_, i) =>
      <ellipse key={i} cx="32" cy="17" rx="6" ry="14" transform={`rotate(${i * 45} 32 32)`} />)
      : kind === "articles" ? <path d="M32 4C34 23 41 30 60 32C41 34 34 41 32 60C30 41 23 34 4 32C23 30 30 23 32 4Z" />
      : [14, 32, 50].flatMap(y => [14, 32, 50].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />))}
  </svg>;
}

function paintFoil(section: HTMLElement, x: number, y: number) {
  // Read before writing: the text-space highlight must follow the actual
  // scrolling/italic glyph bounds, not glow behind the entire section.
  const words = [...section.querySelectorAll<HTMLElement>("[data-foil-word]")];
  const bounds = words.map(word => word.getBoundingClientRect());
  words.forEach((word, i) => {
    word.style.setProperty("--foil-x", `${x - bounds[i].left}px`);
    word.style.setProperty("--foil-y", `${y - bounds[i].top}px`);
    word.style.setProperty("--foil-angle", `${x * .12 + y * .08}deg`);
    const reach = window.innerWidth * .14;
    const near = y > bounds[i].top - reach && y < bounds[i].bottom + reach;
    word.style.setProperty("--foil-play", near ? "running" : "paused");
  });
  section.style.setProperty("--foil-active", "1");
}

/** The recording shows three consecutive full-page rows, not a pinned category
 * sidebar beside an independently clipped table. PageDown follows page flow.
 */
export function AboutRecognition() {
  const recognition = LUSION_ABOUT.recognition;
  const root = useRef<HTMLElement>(null);
  const pointer = useRef<[number, number] | null>(null);
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      frame = 0;
      if (!root.current || document.hidden) return;
      if (pointer.current) paintFoil(root.current, ...pointer.current);
      const bounds = root.current.getBoundingClientRect();
      const recognitionProgress = Math.max(0, Math.min(1, (innerHeight - bounds.top) / (bounds.height + innerHeight)));
      root.current.style.setProperty("--recognition-progress", String(recognitionProgress));

    };
    const schedule = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(refresh);
    };
    // Reproject a stationary pointer after native scroll/resize; no idle loop.
    schedule();
    const observer = new ResizeObserver(schedule);
    if (root.current) observer.observe(root.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <section ref={root} id="about-award" className="about-source-recognition" onPointerMove={event => {
      pointer.current = [event.clientX, event.clientY];
      paintFoil(event.currentTarget, event.clientX, event.clientY);
    }} onPointerLeave={event => {
      pointer.current = null;
      event.currentTarget.style.setProperty("--foil-active", "0");
      event.currentTarget.querySelectorAll<HTMLElement>("[data-foil-word]").forEach(word => {
        word.style.setProperty("--foil-play", "paused");
      });
    }}>
      <div className="about-source-monument" aria-hidden="true" data-awards-word>
        <div>{["AWARD", "WINNING", "MULTI", "DISCIPLINARY", "CREATIVE", "STUDIO"].map((word, i) =>
          <span key={word} data-foil-word data-word={word} className={i % 2 ? "is-slanted" : ""}>{word}</span>)}</div>
      </div>
      <div id="about-recognition-window" role="region" aria-label="Awards, articles and talks" tabIndex={0}>
        <section className="about-source-record" aria-labelledby="about-awards-record-title">
          <h2 id="about-awards-record-title">AWARDS</h2>
          <div className="about-source-record-count"><RecognitionMark kind="awards" /> {recognition.awardsDisplayedTotal}</div>
          <div className="about-source-record-data">
            {recognition.awardGroups.map(group => <div className="about-source-award-group" key={group.organization}>
              <h3>{group.organization}</h3>
              <ul>{group.honors.map(honor => <li key={honor.recognition}>
                <span className="about-source-count">{honor.countFormatted}</span><span>{honor.recognition}</span>
              </li>)}</ul>
            </div>)}
          </div>
        </section>
        <section className="about-source-record" aria-labelledby="about-articles-record-title">
          <h2 id="about-articles-record-title">ARTICLES</h2>
          <div className="about-source-record-count"><RecognitionMark kind="articles" /> {recognition.articlesDisplayedTotal}</div>
          <ul className="about-source-record-data about-source-articles">{recognition.articles.map(article => <li key={article.href}>
            <a href={article.href} target="_blank" rel="noopener noreferrer">{article.title}<span aria-hidden="true">↗</span></a>
          </li>)}</ul>
        </section>
        <section className="about-source-record" aria-labelledby="about-talks-record-title">
          <h2 id="about-talks-record-title">TALKS</h2>
          <div className="about-source-record-count"><RecognitionMark kind="talks" /> {recognition.talksDisplayedTotal}</div>
          <ul className="about-source-record-data about-source-talks">{recognition.talks.map(talk => <li key={`${talk.event}-${talk.dateAndLocation}`}>
            <span>{talk.event}</span><span>{talk.dateAndLocation}</span>
          </li>)}</ul>
        </section>
      </div>
    </section>
  );
}
