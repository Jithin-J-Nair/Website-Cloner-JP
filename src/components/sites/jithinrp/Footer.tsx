"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function Footer() {
  const [time, setTime] = useState("Melbourne");

  useEffect(() => {
    const tick = () => setTime(`Melbourne, ${formatter.format(new Date()).toUpperCase()}`);
    tick();
    const interval = window.setInterval(tick, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const backToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="footer" data-footer>
      <p className="footer__note">
        © 2026 Jithin RP. Powered by caffeine, curiosity &amp; way too many Figma tabs
      </p>
      <div className="footer__meta">
        <span className="footer__time">{time}</span>
        <a className="footer__top" href="#" onClick={backToTop}>
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
