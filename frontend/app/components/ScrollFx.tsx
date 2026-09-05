"use client";
import { useEffect } from "react";

/**
 * Deux effets liés au défilement, volontairement discrets :
 * une barre de progression fine en haut, et l'élévation du header collant.
 */
export default function ScrollFx() {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        document.documentElement.style.setProperty("--scroll", String(p));
        document.querySelectorAll<HTMLElement>(".glass").forEach((el) => {
          el.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="progress-bar" aria-hidden="true" />;
}
