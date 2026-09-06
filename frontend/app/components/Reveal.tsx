"use client";
import { useEffect, useRef } from "react";

/**
 * Fait apparaître ses enfants au défilement (classes .reveal / .reveal-stagger).
 *
 * Deux pièges évités :
 * - l'observateur ne se déclenche qu'après l'hydratation ; si l'utilisateur a déjà
 *   fait défiler la page, le bloc est affiché immédiatement et sans animation,
 *   sinon il « apparaît juste après » son arrivée à l'écran ;
 * - la marge est positive : le bloc se révèle avant d'entrer dans la fenêtre,
 *   il est donc déjà en place quand le regard y arrive.
 */
export default function Reveal({
  children,
  className = "",
  stagger = false,
  as: Tag = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  as?: "div" | "section" | "ul" | "footer";
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Déjà à l'écran au moment de l'hydratation : rien à animer, on montre.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      if (window.scrollY > 0) el.classList.add("is-instant"); // l'utilisateur a défilé avant : pas de fondu tardif
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); }
        }
      },
      { threshold: 0, rootMargin: "0px 0px 18% 0px" }, // marge positive : on anticipe l'arrivée
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T ref={ref} id={id} className={`${stagger ? "reveal-stagger" : "reveal"} ${className}`}>{children}</T>;
}
