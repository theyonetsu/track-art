"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { api, getToken } from "../lib/api";

type Me = { id: string; email: string; role: string; name: string | null; studioName: string | null };

const NAV = [
  { href: "/admin/dashboard", label: "Galeries" },
  { href: "/admin/ventes", label: "Ventes" },
  { href: "/admin/compte", label: "Compte" },
  { href: "/aide", label: "Aide" },
];

/** Cadre commun de l'espace photographe : header collant, navigation, déconnexion. */
export default function AdminShell({ children, title, actions }: { children: React.ReactNode; title?: string; actions?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/admin/login"); return; }
    api<Me>("/me").then(setMe).catch(() => {});
  }, [router]);

  function logout() { localStorage.removeItem("token"); router.push("/admin/login"); }

  return (
    <div className="min-h-screen bg-sand text-ink grain">
      <header className="sticky top-0 z-30 glass border-b border-line">
        <div className="px-6 md:px-12 h-[68px] flex items-center gap-4 lg:gap-8">
          <Logo href="/admin/dashboard" size="sm" />
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={`label transition-colors ${active ? "text-terracotta" : "text-ink-soft hover:text-ink"}`}>{n.label}</Link>
              );
            })}
            {me?.role === "SUPERADMIN" && (
              <Link href="/admin/plateforme" className={`label transition-colors ${pathname?.startsWith("/admin/plateforme") ? "text-terracotta" : "text-ink-soft hover:text-ink"}`}>Plateforme</Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-5 min-w-0">
            {me && <span className="meta hidden xl:inline truncate max-w-[220px]">{me.studioName ?? me.name ?? me.email}</span>}
            <button onClick={logout} className="tap label text-muted hover:text-terracotta transition-colors shrink-0">Déconnexion</button>
          </div>
        </div>
        <nav className="lg:hidden flex gap-5 px-6 pb-3 overflow-x-auto scrollbar-none">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`label whitespace-nowrap ${pathname?.startsWith(n.href) ? "text-terracotta" : "text-ink-soft"}`}>{n.label}</Link>
          ))}
        </nav>
      </header>
      {(title || actions) && (
        <div className="px-6 md:px-12 pt-10 pb-2 flex flex-wrap items-end justify-between gap-4">
          {title && <h1 className="font-serif text-4xl">{title}</h1>}
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      )}
      <main className="px-6 md:px-12 py-8">{children}</main>
    </div>
  );
}
