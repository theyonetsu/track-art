import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-line/70">
      <div className="flex items-center justify-between px-6 md:px-20 h-[76px]">
        <Logo />
        <nav className="hidden lg:flex gap-10 label text-ink">
          <a href="/#fonctionnement" className="hover:text-terracotta transition-colors">Fonctionnement</a>
          <a href="/#exemples" className="hover:text-terracotta transition-colors">Exemples</a>
          <a href="/#tarifs" className="hover:text-terracotta transition-colors">Tarifs</a>
          <Link href="/aide" className="hover:text-terracotta transition-colors">Aide</Link>
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/admin/login" className="label hover:text-terracotta transition-colors">Connexion</Link>
          <Link href="/inscription" className="btn btn-primary hidden sm:inline-flex">Essayer gratuitement</Link>
        </div>
      </div>
    </header>
  );
}
