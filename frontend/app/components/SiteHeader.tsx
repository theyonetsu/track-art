"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

const LINKS = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#exemples", label: "Exemples" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/aide", label: "Aide" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Empêche le défilement de l'arrière-plan quand le menu est ouvert
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 glass border-b border-line/70">
      <div className="flex items-center justify-between px-6 md:px-20 h-[76px] gap-4">
        <Logo />

        <nav className="hidden lg:flex gap-10 label text-ink">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-terracotta transition-colors">{l.label}</Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-6">
          <Link href="/admin/login" className="label hover:text-terracotta transition-colors">Connexion</Link>
          <Link href="/inscription" className="btn btn-primary">Essayer gratuitement</Link>
        </div>

        {/* Menu téléphone */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="lg:hidden w-11 h-11 -mr-2 flex flex-col items-center justify-center gap-[5px]"
        >
          <span className={`block w-6 h-px bg-ink transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-6 h-px bg-ink transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-px bg-ink transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-line bg-sand fade-up">
          <nav className="flex flex-col px-6 py-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="label py-4 border-b border-line/60 hover:text-terracotta transition-colors">
                {l.label}
              </Link>
            ))}
            <Link href="/admin/login" onClick={() => setOpen(false)} className="sm:hidden label py-4 border-b border-line/60 hover:text-terracotta transition-colors">
              Connexion
            </Link>
          </nav>
          <div className="sm:hidden px-6 pb-6 pt-2">
            <Link href="/inscription" onClick={() => setOpen(false)} className="btn btn-accent w-full">Essayer gratuitement</Link>
          </div>
        </div>
      )}
    </header>
  );
}
