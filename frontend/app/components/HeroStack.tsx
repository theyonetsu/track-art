"use client";
import { useRef } from "react";

/**
 * Collage de trois « tirages » qui se chevauchent, avec une inclinaison 3D
 * qui suit la souris (perspective CSS). Les fonds sont des aplats chauds en
 * attendant de vraies photos.
 */
const prints = [
  { src: "/showcase/reception-bokeh.webp", w: 300, h: 375, x: 40, y: 60, r: -6, z: 1 },
  { src: "/showcase/bouquet.webp", w: 340, h: 425, x: 220, y: 0, r: 3, z: 3 },
  { src: "/showcase/golden-hour.webp", w: 300, h: 250, x: 430, y: 150, r: 8, z: 2 },
];

export default function HeroStack() {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 10).toFixed(2)}deg`);
    el.style.setProperty("--tx", `${(px * 12).toFixed(2)}px`);
    el.style.setProperty("--ty", `${(py * 12).toFixed(2)}px`);
  }
  function onLeave() {
    const el = ref.current; if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((k) => el.style.setProperty(k, "0"));
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative mx-auto w-full max-w-[720px] aspect-[720/560]"
      style={{ perspective: "1400px" }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(var(--rx, 0)) rotateY(var(--ry, 0))",
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {prints.map((p, i) => (
          <div
            key={i}
            className="absolute bg-white p-2.5 pb-8"
            style={{
              left: `${(p.x / 720) * 100}%`,
              top: `${(p.y / 560) * 100}%`,
              width: `${(p.w / 720) * 100}%`,
              zIndex: p.z,
              transform: `rotate(${p.r}deg) translate3d(calc(var(--tx, 0) * ${p.z * 0.6}), calc(var(--ty, 0) * ${p.z * 0.6}), ${p.z * 30}px)`,
              boxShadow: "0 2px 4px rgba(34,27,24,0.08), 0 30px 60px -20px rgba(34,27,24,0.45)",
              transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{ aspectRatio: `${p.w} / ${p.h}`, backgroundImage: `url(${p.src})`, backgroundSize: "cover", backgroundPosition: "center" }} className="relative overflow-hidden" />
          </div>
        ))}

        {/* Carte flottante : preuve produit */}
        <div
          className="hidden sm:flex absolute left-0 bottom-0 card px-5 py-4 flex-col gap-1 float"
          style={{ zIndex: 4, transform: "translate3d(calc(var(--tx, 0) * 1.2), calc(var(--ty, 0) * 1.2), 60px)" }}
        >
          <span className="label text-terracotta">Sélection en cours</span>
          <span className="font-serif text-2xl leading-none">12 <span className="text-muted text-lg">/ 30 incluses</span></span>
          <span className="text-xs text-muted">Léa &amp; Thomas · expire dans 23 jours</span>
        </div>
      </div>
    </div>
  );
}
