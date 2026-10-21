"use client";

import { useCallback, useEffect, useState } from "react";

import { About } from "./About";
import { Awards } from "./Awards";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { GenAi } from "./GenAi";
import { Hero } from "./Hero";
import { Loader } from "./Loader";
import { Marquee } from "./Marquee";
import { MobileGate } from "./MobileGate";
import { Nav } from "./Nav";
import { Pillars } from "./Pillars";
import { ProjectModal, findModal } from "./ProjectModal";
import { SiteRuntime } from "./SiteRuntime";
import { Testimonials } from "./Testimonials";
import { Works } from "./Works";

/**
 * jithinrp.com — landing page.
 * Section order, copy and assets follow the reference one-for-one; the clone's
 * behaviour (loader, pinned works strip, carousel, modals, cursor, sound) lives in
 * the components and in `SiteRuntime`.
 */
export function Landing() {
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);

  const handleOpenModal = useCallback((id: string, from: HTMLElement) => {
    setReturnFocus(from);
    setOpenModalId(id);
  }, []);

  const closeModal = useCallback(() => setOpenModalId(null), []);
  const activeModal = openModalId ? findModal(openModalId) : null;

  /* The source page locks scrolling while a project dialog is open. */
  useEffect(() => {
    document.body.classList.toggle("jrp-modal-open", Boolean(openModalId));
    return () => document.body.classList.remove("jrp-modal-open");
  }, [openModalId]);

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Loader />
      <MobileGate />
      <div className="site">
        <Nav />
        <div className="navbar-spacer" aria-hidden="true" />
        <main id="top">
          <Hero />
          <Pillars />
          <Marquee />
          <Works />
          <GenAi onOpenModal={handleOpenModal} />
          <About />
          <Awards />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
      </div>

      {activeModal ? (
        <ProjectModal modal={activeModal} onClose={closeModal} returnFocus={returnFocus} />
      ) : null}

      <SiteRuntime />
    </>
  );
}
