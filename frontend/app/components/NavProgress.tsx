"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Retour visuel immédiat pendant un changement de page.
 * Sans lui, un clic sur un lien ne produit rien de visible tant que la page
 * suivante n'est pas prête : l'utilisateur croit que le lien est mort et reclique.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // La nouvelle page est affichée : on éteint la barre.
  useEffect(() => { setLoading(false); }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.hasAttribute("download") || a.target === "_blank") return;
      if (/^(https?:)?\/\//.test(href) && !href.startsWith(window.location.origin)) return;
      if (/^(mailto:|tel:|#)/.test(href)) return;
      let url: URL;
      try { url = new URL(a.href); } catch { return; }
      if (url.pathname === window.location.pathname) return; // simple ancre sur la même page
      setLoading(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Filet de sécurité : jamais de barre bloquée à l'écran.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 12000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return <div className="nav-progress" role="status" aria-label="Chargement de la page" />;
}
