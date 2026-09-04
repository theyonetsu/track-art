"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../components/AdminShell";
import { Field, Toast } from "../../components/ui";
import { api, daysLeft, formatDate } from "../../lib/api";

type Gallery = {
  id: string; title: string; slug: string; maxSelection: number; expiresAt: string | null; createdAt: string;
  clientName: string | null; clientEmail: string | null; eventDate: string | null; isArchived: boolean;
  photos: { id: string; unlocked: boolean; paid: boolean }[]; _count: { payments: number };
};
type Me = { defaultIncluded: number; defaultExpiryDays: number };

function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const [galleries, setGalleries] = useState<Gallery[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ title: "", clientName: "", clientEmail: "", eventDate: "", maxSelection: 30 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    const [g, m] = await Promise.all([api<Gallery[]>("/galleries"), api<Me>("/me")]);
    setGalleries(g); setMe(m);
    setForm((f) => ({ ...f, maxSelection: m.defaultIncluded }));
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => { if (params.get("bienvenue")) setToast({ m: "Bienvenue ! Créez votre première galerie." }); }, [params]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const g = await api<Gallery>("/galleries", { method: "POST", json: { ...form, eventDate: form.eventDate || null, sendEmail: false } });
      router.push(`/admin/gallery/${g.id}`);
    } catch (err) { setToast({ m: err instanceof Error ? err.message : "Erreur", e: true }); setLoading(false); }
  }

  function copy(g: Gallery) { navigator.clipboard.writeText(`${window.location.origin}/g/${g.slug}`); setCopied(g.id); setTimeout(() => setCopied(null), 1800); }

  const visible = (galleries ?? []).filter((g) => showArchived ? g.isArchived : !g.isArchived);
  const archivedCount = (galleries ?? []).filter((g) => g.isArchived).length;

  return (
    <AdminShell title="Galeries">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
        <form onSubmit={create} className="card p-7 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="flex flex-col gap-1 mb-1"><p className="eyebrow">Nouvelle galerie</p><h2 className="font-serif text-3xl">Créer une galerie</h2></div>
          <Field label="Titre"><input className="input" placeholder="Léa & Thomas — Mariage" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><input className="input" placeholder="Léa Martin" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></Field>
            <Field label="Date de séance"><input type="date" className="input num" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></Field>
          </div>
          <Field label="Email du client" hint="Pour envoyer le lien en un clic."><input type="email" className="input" placeholder="client@email.com" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} /></Field>
          <Field label="Photos incluses dans le forfait" hint={`Nombre libre. Votre valeur par défaut : ${me?.defaultIncluded ?? 30}.`}>
            <input type="number" min={1} className="input num" value={form.maxSelection} onChange={(e) => setForm({ ...form, maxSelection: Number(e.target.value) })} required />
          </Field>
          <button type="submit" disabled={loading} className="btn btn-accent w-full mt-1">{loading ? "Création…" : "Créer et ajouter les photos"}</button>
          <p className="help">Mot de passe, prix, durée de validité et message au client se règlent à l’étape suivante.</p>
        </form>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-serif text-3xl">{showArchived ? "Archivées" : "En cours"}</h2>
            <div className="flex items-center gap-5">
              <span className="meta">{visible.length} galerie{visible.length > 1 ? "s" : ""}</span>
              {archivedCount > 0 || showArchived ? <button onClick={() => setShowArchived(!showArchived)} className="label text-muted hover:text-terracotta">{showArchived ? "← En cours" : `Archivées (${archivedCount})`}</button> : null}
            </div>
          </div>
          {galleries === null && <p className="meta">Chargement…</p>}
          {galleries !== null && visible.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3 card">
              <p className="font-serif text-2xl text-ink-soft">{showArchived ? "Aucune galerie archivée." : "Aucune galerie pour l'instant."}</p>
              {!showArchived && <p className="help">Créez votre première galerie à gauche, puis glissez-déposez vos photos.</p>}
            </div>
          )}
          <ul className="flex flex-col gap-4 reveal-stagger is-visible">
            {visible.map((g) => {
              const d = daysLeft(g.expiresAt);
              const unlocked = g.photos.filter((p) => p.unlocked).length;
              const status = g.isArchived ? "Archivée" : d === null ? "En attente d'ouverture" : d > 0 ? `Expire dans ${d} j` : "Expirée";
              return (
                <li key={g.id} className="card card-hover grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-6 py-5 items-center">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href={`/admin/gallery/${g.id}`} className="font-serif text-2xl hover:text-terracotta transition-colors truncate">{g.title}</Link>
                      <span className={`badge ${d !== null && d <= 3 && !g.isArchived ? "badge-accent" : ""}`}>{status}</span>
                    </div>
                    <p className="meta">
                      {g.clientName && <span>{g.clientName} · </span>}
                      {g.eventDate && <span>{formatDate(g.eventDate)} · </span>}
                      <span className="num">{g.photos.length}</span> photo{g.photos.length > 1 ? "s" : ""} · <span className="num">{unlocked}</span>/<span className="num">{g.maxSelection}</span> incluses utilisées
                      {g._count.payments > 0 && <span> · {g._count.payments} paiement{g._count.payments > 1 ? "s" : ""}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button onClick={() => copy(g)} className={`label transition-colors ${copied === g.id ? "text-terracotta" : "text-muted hover:text-terracotta"}`}>{copied === g.id ? "Lien copié" : "Copier le lien"}</button>
                    <Link href={`/admin/gallery/${g.id}`} className="btn btn-outline">Gérer</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      {toast && <Toast message={toast.m} error={toast.e} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Dashboard /></Suspense>;
}
