const clamp = (n: number) => Math.max(0, Math.min(1, n));
const expo = (n: number) => n >= 1 ? 1 : 1 - 2 ** (-10 * n);
const fit = (time: number, from: number, to: number) => expo(clamp((time - from) / (to - from)));
const back = (n: number) => 1 + 2.70158 * (n - 1) ** 3 + 1.70158 * (n - 1) ** 2;

/** All editorial motion is advanced by the paint owner's clock, never a second
 * RAF or independent animation timers. Source stagger and reversible reveals. */
export function createAboutRecognitionMotion(section: HTMLElement, reduced: boolean) {
  const headers = [...section.querySelectorAll<HTMLElement>("[data-recognition-header]")].map(root => ({
    root, time: 0, chars: [...root.querySelectorAll<HTMLElement>("h2 [data-recognition-char]")],
    numbers: [...root.querySelectorAll<HTMLElement>("[data-recognition-number] [data-recognition-char]")],
    icon: root.querySelector<HTMLElement>(".about-recognition-mark"),
  }));
  const items = [...section.querySelectorAll<HTMLElement>("[data-recognition-item]")].map(root => ({
    root, time: 0, line: root.querySelector<HTMLElement>(".about-recognition-line"),
    words: [...root.querySelectorAll<HTMLElement>("[data-recognition-word]")],
  }));
  return {
    reset() { for (const item of [...headers, ...items]) item.time = 0; },
    update(dt: number) {
      // Measure every row before changing a style, including on reverse scroll.
      const h = innerHeight, mobile = innerWidth < 1000;
      const positions = [...headers, ...items].map(item => item.root.getBoundingClientRect());
      headers.forEach((header, index) => {
        const rect = positions[index], entering = rect.top < h;
        header.time = Math.max(0, Math.min(1.5, header.time + (entering ? dt : -dt)));
        if (header.icon) {
          const ratio = clamp((h - rect.top) / (h + rect.height)) * 2 - 1;
          const rotation = (index % 2 ? 360 : -360) * (1 - clamp((ratio - index / 10 + 1) / 2));
          header.icon.style.transform = reduced ? "none" : `scale(${back(clamp((header.time - .2) / .4))}) rotate(${rotation}deg)`;
        }
        header.chars.forEach((char, i) => {
          const p = reduced || mobile ? 1 : fit(header.time - i / 25, 0, .7);
          char.style.transform = `translate3d(0,${(1 - p) * 100}%,0) rotate(${(1 - p) * 30}deg)`;
        });
        header.numbers.forEach((char, i) => {
          const p = reduced || mobile ? 1 : fit(header.time - i / 20, .2, .9);
          char.style.transform = `translate3d(0,${(1 - p) * 100}%,0)`;
        });
      });
      items.forEach((item, index) => {
        item.time = Math.max(0, Math.min(1.5, item.time + (positions[headers.length + index].top < h ? dt : -dt)));
        if (item.line) item.line.style.transform = `scaleX(${reduced ? 1 : fit(item.time, .2, 1)})`;
        item.words.forEach(word => {
          const p = reduced || mobile ? 1 : fit(item.time - Number(word.dataset.recognitionDelay || 0), 0, .8);
          word.style.transform = `translate3d(0,${(1 - p) * 100}%,0)`;
        });
      });
    },
    dispose() {
      for (const element of section.querySelectorAll<HTMLElement>("[data-recognition-char],[data-recognition-word],.about-recognition-line,.about-recognition-mark")) element.style.removeProperty("transform");
    },
  };
}
