"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "../../components/Logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Gallery = {
  id: string;
  title: string;
  slug: string;
  maxSelection: number;
  expiresAt: string | null;
  createdAt: string;
  clientEmail: string | null;
  photos: { unlocked: boolean }[];
};

function daysLeft(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function Dashboard() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [maxSelection, setMaxSelection] = useState(30);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("token") ?? "";
    if (!t) { router.replace("/admin/login"); return; }
    setToken(t);
  }, [router]);

  const fetchGalleries = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/galleries`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const data = await res.json();
      if (Array.isArray(data)) setGalleries(data);
    } catch (e) { console.error(e); }
  }, [token, router]);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  async function createGallery(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${API}/galleries`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, clientEmail: email || null, maxSelection, languages: ["fr"] }) });
      if (res.ok) {
        const g = await res.json();
        setTitle(""); setEmail("");
        router.push(`/admin/gallery/${g.id}`);
        return;
      }
      fetchGalleries();
    } finally { setLoading(false); }
  }

  async function deleteGallery(g: Gallery) {
    if (!confirm(`Supprimer « ${g.title} » et toutes ses photos ?`)) return;
    await fetch(`${API}/galleries/${g.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchGalleries();
  }

  function copyLink(g: Gallery) {
    navigator.clipboard.writeText(`${window.location.origin}/g/${g.slug}`);
    setCopied(g.id);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="min-h-screen bg-sand text-ink">
      <header className="flex items-center justify-between px-6 md:px-20 py-7 border-b border-line">
        <Logo href="/admin/dashboard" />
        <div className="flex items-center gap-8">
          <span className="label text-muted hidden sm:inline">Espace photographe</span>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/admin/login"); }} className="label hover:text-terracotta transition-colors">Déconnexion</button>
        </div>
      </header>

      <div className="px-6 md:px-20 py-12 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-12 lg:gap-20">
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="label text-terracotta">Nouvelle galerie</p>
            <h2 className="font-serif text-3xl">Créer une galerie</h2>
          </div>
          <form onSubmit={createGallery} className="flex flex-col gap-4">
            <input type="text" placeholder="Nom de la galerie (ex. Léa & Thomas)" value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
            <input type="email" placeholder="Email du client (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            <select value={maxSelection} onChange={(e) => setMaxSelection(Number(e.target.value))} className="input">
              <option value={15}>15 photos incluses</option>
              <option value={30}>30 photos incluses</option>
              <option value={60}>60 photos incluses</option>
            </select>
            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">{loading ? "Création…" : "Créer la galerie"}</button>
            <p className="text-sm text-muted">Vous ajouterez les photos à l’étape suivante.</p>
          </form>
        </aside>

        <main className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <h2 className="font-serif text-3xl">Vos galeries</h2>
            <span className="label text-muted">{galleries.length} galerie{galleries.length > 1 ? "s" : ""}</span>
          </div>

          {galleries.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <p className="font-serif text-2xl text-ink-soft">Aucune galerie pour l’instant.</p>
              <p className="text-sm text-muted">Créez votre première galerie à gauche.</p>
            </div>
          )}

          <ul className="flex flex-col">
            {galleries.map((g) => {
              const d = daysLeft(g.expiresAt);
              const unlocked = g.photos?.filter((p) => p.unlocked).length ?? 0;
              return (
                <li key={g.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 py-6 border-b border-line items-center">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <Link href={`/admin/gallery/${g.id}`} className="font-serif text-2xl hover:text-terracotta transition-colors truncate">{g.title}</Link>
                    <p className="text-sm text-muted">
                      {g.photos?.length ?? 0} photo{(g.photos?.length ?? 0) > 1 ? "s" : ""} · {g.maxSelection} incluses · {unlocked} déverrouillée{unlocked > 1 ? "s" : ""}
                      {g.clientEmail && <span> · {g.clientEmail}</span>}
                    </p>
                    <p className={`label ${d !== null && d <= 3 ? "text-terracotta" : "text-muted"}`}>
                      {d === null ? "Pas encore ouverte" : d > 0 ? `Expire dans ${d} jour${d > 1 ? "s" : ""}` : "Expirée"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-5 items-center">
                    <button onClick={() => copyLink(g)} className={`label transition-colors ${copied === g.id ? "text-terracotta" : "hover:text-terracotta"}`}>{copied === g.id ? "Lien copié" : "Copier le lien"}</button>
                    <Link href={`/admin/gallery/${g.id}`} className="btn btn-outline">Gérer</Link>
                    <button onClick={() => deleteGallery(g)} className="label text-muted hover:text-terracotta transition-colors">Supprimer</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
      </div>
    </div>
  );
}
