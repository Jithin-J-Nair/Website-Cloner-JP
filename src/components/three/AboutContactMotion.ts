const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fit = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
const cubic = (x: number) => x < .5 ? 4 * x ** 3 : 1 + 4 * (x - 1) ** 3;
/** Native editorial easing, cubic-bezier(.35,0,0,1). */
export function aboutContactEase(x: number) {
  const target = clamp(x); let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) { const t = (lo + hi) * .5, sample = 1.05 * t * (1 - t) ** 2 + t ** 3; if (sample < target) lo = t; else hi = t; }
  const t = (lo + hi) * .5;
  return target === 0 || target === 1 ? target : 3 * t * t - 2 * t ** 3;
}

/** DOM choreography shares the contact field's RAF and visible clock. */
export function createAboutContactMotion(stage: HTMLElement, reduced: boolean) {
  const section = stage.closest('section');
  const content = stage.querySelector<HTMLElement>('#end-section-content');
  const title = stage.querySelector<HTMLElement>('#end-section-title-link');
  const words = Array.from(stage.querySelectorAll<HTMLElement>('[data-cta-word]')).map(element => ({
    element, letters: Array.from(element.querySelectorAll<HTMLElement>('[data-cta-letter]')),
    tracks: Array.from(element.querySelectorAll<HTMLElement>('[data-cta-roll]')), ratio: 0, selected: 0,
  }));
  const subtitle = Array.from(stage.querySelectorAll<HTMLElement>('[data-cta-subtitle-word]'));
  const crosses = Array.from(stage.querySelectorAll<HTMLElement>('.end-section-content-cross'));
  const decorations = Array.from(stage.querySelectorAll<HTMLElement>('[data-cta-decoration]'));
  let active = reduced ? 1 : 0, hover = 0, time = 0;
  return {
    update(dt: number) {
      const rect = section?.getBoundingClientRect();
      const entered = !rect || rect.top < stage.clientHeight * .1;
      const elapsed = Math.max(0, Math.min(.1, dt));
      active = reduced ? 1 : clamp(active + (entered ? elapsed : -elapsed));
      const hovering = !!title?.matches(':hover,:focus-visible');
      hover = reduced ? (hovering ? 1 : 0) : clamp(hover + (hovering && active === 1 ? elapsed : -elapsed));
      const oldTime = time; time += elapsed;
      const roll = !reduced && Math.floor(oldTime / 2) !== Math.floor(time / 2);
      if (content) {
        const exit = rect ? fit(-rect.bottom / stage.clientHeight, -.75, 0) : 0;
        content.style.transform = `translate(-50%,-50%) scale(${1 - .1 * exit})`;
      }
      crosses.forEach((cross, i) => {
        const t = aboutContactEase(fit(active, i / Math.max(1, crosses.length - 1) * .2, i / Math.max(1, crosses.length - 1) * .2 + .7));
        cross.style.transform = `scale(${aboutContactEase(t)}) rotate(${180 * aboutContactEase(t)}deg)`;
      });
      subtitle.forEach((word, i) => {
        const t = i / Math.max(1, subtitle.length - 1);
        word.style.transform = `translateY(${200 * (1 - aboutContactEase(fit(active, t * .15, t * .15 + .75)))}%) rotate(${30 * (1 - aboutContactEase(fit(active, t * .1, t * .1 + .8)))}deg)`;
      });
      words.forEach((word, i) => {
        const fraction = i / Math.max(1, words.length - 1);
        if (roll) { word.selected = Math.floor(Math.random() * word.letters.length); if (!word.ratio) word.ratio = .001; }
        if (word.ratio) { word.ratio = clamp(word.ratio + (entered ? elapsed : -elapsed * 2)); if (word.ratio === 1) word.ratio = 0; }
        word.letters.forEach((letter, index) => {
          const t = fraction * .15 + index / Math.max(1, word.letters.length - 1) * .15;
          letter.style.transform = `translateY(${100 * (1 - aboutContactEase(fit(active, t, t + .7)))}%)`;
          word.tracks[index].style.transform = `translateY(${-100 * (index === word.selected ? aboutContactEase(fit(word.ratio, fraction * .2, fraction * .2 + .8)) : 0)}%)`;
        });
      });
      const underline = cubic(fit(hover, .2, 1));
      if (decorations[0]) decorations[0].style.transform = `scaleX(${cubic(fit(hover, 0, .7))})`;
      if (decorations[1]) decorations[1].style.transform = `scaleX(${fit(underline, 0, .35)})`;
      if (decorations[2]) decorations[2].style.transform = `scaleX(${fit(underline, .4, 1)})`;
    },
  };
}
