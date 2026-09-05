import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="px-6 md:px-20 py-12 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="flex flex-col gap-3 max-w-sm">
          <Logo size="sm" />
          <p className="text-sm text-ink-soft leading-relaxed">Galeries privées pour photographes. Vos clients choisissent, vous encaissez.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-3 label text-muted">
          <a href="/#fonctionnement" className="hover:text-terracotta transition-colors">Fonctionnement</a>
          <Link href="/contact" className="hover:text-terracotta transition-colors">Contact</Link>
          <a href="/#tarifs" className="hover:text-terracotta transition-colors">Tarifs</a>
          <Link href="/mentions-legales" className="hover:text-terracotta transition-colors">Mentions légales</Link>
          <Link href="/aide" className="hover:text-terracotta transition-colors">Aide &amp; FAQ</Link>
          <Link href="/inscription" className="hover:text-terracotta transition-colors">Créer un compte</Link>
          <Link href="/admin/login" className="hover:text-terracotta transition-colors">Connexion</Link>
          <Link href="/confidentialite" className="hover:text-terracotta transition-colors">Confidentialité</Link>
          <Link href="/cgv" className="hover:text-terracotta transition-colors">Conditions générales</Link>
        </nav>
      </div>
      <div className="px-6 md:px-20 py-5 border-t border-line/70 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted">
        <span>© {new Date().getFullYear()} Track.Art · trak.art</span>
        <span>Fait pour les photographes, par des photographes.</span>
      </div>
    </footer>
  );
}
