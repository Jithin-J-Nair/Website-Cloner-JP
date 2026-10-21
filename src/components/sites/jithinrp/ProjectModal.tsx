"use client";

import { useCallback, useEffect, useRef } from "react";

import { PROJECT_MODALS } from "./data";
import type { ProjectModal as ProjectModalData } from "@/types/jithinrp";

const IMAGE_EXTENSIONS = ["webp", "jpg", "png", "jpeg"];

type ProjectModalProps = {
  modal: ProjectModalData;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
};

/** One project dialog (Parcel Sorter, UNDO, Stickskate): Esc / backdrop / X closes it. */
export function ProjectModal({ modal, onClose, returnFocus }: ProjectModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });
    const video = videoRef.current;
    if (video) video.play().catch(() => {});
    document.documentElement.classList.add("has-modal");
    document.body.classList.add("is-modal");

    return () => {
      document.documentElement.classList.remove("has-modal");
      document.body.classList.remove("is-modal");
      if (video) video.pause();
      returnFocus?.focus({ preventScroll: true });
    };
  }, [returnFocus]);

  /* Gallery: the source asks for 01…08 and drops the images the server doesn't have. */
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || !modal.gallery) return;
    gallery.innerHTML = "";
    for (let i = 1; i <= modal.gallery.count; i++) {
      const name = String(i).padStart(2, "0");
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = "";
      let ext = 0;
      img.onerror = () => {
        ext += 1;
        if (ext < IMAGE_EXTENSIONS.length) img.src = `${modal.gallery?.base}${name}.${IMAGE_EXTENSIONS[ext]}`;
        else img.remove();
      };
      img.src = `${modal.gallery.base}${name}.${IMAGE_EXTENSIONS[0]}`;
      gallery.appendChild(img);
    }
  }, [modal]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(
        "button, a[href], video[controls], [tabindex]:not([tabindex='-1'])",
      )].filter((el) => el.offsetParent);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const layoutClass =
    modal.media.layout === "tall"
      ? "pmodal__media pmodal__media--tall"
      : modal.media.layout === "wide"
        ? "pmodal__media pmodal__media--wide"
        : "pmodal__media";

  return (
    <div className="pmodal" role="dialog" aria-modal="true" aria-labelledby={`pmodal-${modal.id}-title`}>
      <div className="pmodal__backdrop" onClick={close} />
      <div className="pmodal__panel" tabIndex={-1} ref={panelRef}>
        <button className="pmodal__close" type="button" aria-label="Close" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p className="pmodal__eyebrow">{modal.eyebrow}</p>
        <h2 className="pmodal__title" id={`pmodal-${modal.id}-title`}>
          {modal.title}
        </h2>
        <p className="pmodal__lede">{modal.lede}</p>

        <div className={layoutClass}>
          <video
            ref={videoRef}
            src={modal.media.src}
            poster={modal.media.poster}
            controls={modal.media.layout !== "auto"}
            muted={modal.media.layout === "auto"}
            loop={modal.media.layout === "auto"}
            playsInline
            preload="none"
          />
        </div>

        {modal.sections.map((section) => (
          <section className="pmodal__section" key={section.heading}>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
          </section>
        ))}

        {modal.gallery ? <div className="pmodal__gallery" ref={galleryRef} /> : null}
      </div>
    </div>
  );
}

export function findModal(id: string) {
  return PROJECT_MODALS.find((modal) => modal.id === id) ?? null;
}
