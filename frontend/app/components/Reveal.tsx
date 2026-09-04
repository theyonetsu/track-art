"use client";
import { useEffect, useRef } from "react";

/** Fait apparaître ses enfants au défilement (classe .reveal / .reveal-stagger). */
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
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T ref={ref} id={id} className={`${stagger ? "reveal-stagger" : "reveal"} ${className}`}>{children}</T>;
}
