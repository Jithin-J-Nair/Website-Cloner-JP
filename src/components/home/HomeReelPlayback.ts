/** Controls the inline reel from the existing editorial frame owner. Browsers
 * that reject audible autoplay keep a muted preview and expose a sound button. */
export function createHomeReelPlayback(video: HTMLVideoElement, soundButton: HTMLButtonElement) {
  let visible = false, expanded = false, pending = false, disposed = false, generation = 0;
  let userMuted = video.dataset.userMuted === "true";
  const syncButton = () => {
    const muted = video.muted;
    soundButton.textContent = muted ? "Sound on" : "Sound off";
    soundButton.setAttribute("aria-label", muted ? "Enable reel sound" : "Mute reel sound");
    soundButton.setAttribute("aria-pressed", String(!muted));
    video.dataset.reelSound = muted ? "muted" : "on";
  };
  const play = (audible: boolean) => {
    const token = ++generation;
    pending = true;
    if (audible && !video.paused) video.pause();
    video.muted = !audible;
    syncButton();
    void video.play().then(() => {
      if (disposed || token !== generation) return;
      pending = false;
    }).catch(() => {
      if (disposed || token !== generation) return;
      pending = false;
      if (audible && visible) {
        video.muted = true;
        syncButton();
        pending = true;
        void video.play().catch(() => {}).finally(() => {
          if (!disposed && token === generation) pending = false;
        });
      }
    });
  };
  const toggleSound = (event: Event) => {
    event.stopPropagation();
    userMuted = !video.muted;
    video.dataset.userMuted = String(userMuted);
    if (userMuted) {
      generation++; pending = false; video.muted = true; syncButton();
      if (visible && video.paused) play(false);
    } else {
      // Keep the play request inside the user gesture for restrictive browsers.
      play(true);
    }
  };
  soundButton.addEventListener("click", toggleSound);
  syncButton();
  return {
    update(shouldPlay: boolean, isExpanded: boolean) {
      const entered = shouldPlay && isExpanded && (!visible || !expanded);
      visible = shouldPlay; expanded = isExpanded;
      if (!shouldPlay) {
        if (pending || !video.paused) { generation++; pending = false; video.pause(); }
        if (!video.muted) { video.muted = true; syncButton(); }
      } else if (entered && !userMuted) {
        play(true);
      } else if (!isExpanded && !video.muted) {
        video.muted = true; syncButton();
      } else if (video.paused && !pending) {
        play(isExpanded && !userMuted && !video.muted);
      }
    },
    dispose() {
      disposed = true; generation++; soundButton.removeEventListener("click", toggleSound);
      video.pause(); video.muted = true;
    },
  };
}
