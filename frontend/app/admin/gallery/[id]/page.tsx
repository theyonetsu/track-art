"use client";
import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../../components/AdminShell";
import { Section, Field, Switch, Toast, usePolicy, LockedBadge } from "../../../components/ui";
import { api, API, getToken, daysLeft, formatDate, euros } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Gallery = {
  id: string; title: string; slug: string; url: string; maxSelection: number; expiryDays: number;
  clientName: string | null; clientEmail: string | null; clientPhone: string | null; eventDate: string | null; message: string | null;
  extraPhotoPrice: number | null; extensionPrice: number | null; extensionDays: number | null; allPhotosPrice: number | null; languages: string[];
  allowHdDownload: boolean; coverPhotoId: string | null; isArchived: boolean; hasPassword: boolean;
  expiresAt: string | null; firstOpenedAt: string | null; createdAt: string;
  effective: { extraPhotoPrice: number; extensionPrice: number; extensionDays: number; allPhotosPrice: number | null; commissionRate: number; studioName: string | null; watermarkText: string };
  payments: { id: string; type: string; amount: number; netAmount: number; status: string; createdAt: string; photoIds: string[] }[];
  extensions: { id: string; days: number; amount: number; createdAt: string }[];
};
type Photo = { id: string; unlocked: boolean; paid: boolean; price: number; filename: string | null; previewUrl: string; isCover: boolean; width: number | null; height: number | null };
type Pending = { localId: string; url: string; name: string };

const TYPE: Record<string, string> = { BuyExtraPhotos: "Photos supplémentaires", ExtendGallery: "Prolongation", photos: "Photos supplémentaires" };

export default function AdminGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [g, setG] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [form, setForm] = useState<Partial<Gallery> & { password?: string }>({});
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [editPrice, setEditPrice] = useState<{ id: string; v: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const fileRef = useRef<HTMLInputElement>(null);
  const policy = usePolicy();

  const notify = (m: string, e = false) => setToast({ m, e });

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [gal, ph] = await Promise.all([api<Gallery>(`/galleries/manage/${id}`), api<Photo[]>(`/photos/gallery/${id}/admin`)]);
    setG(gal); setPhotos(ph);
    setForm({ ...gal, eventDate: gal.eventDate ? gal.eventDate.slice(0, 10) : "", password: "" });
  }, [id]);
  useEffect(() => { load().catch((e) => { setLoadError(e instanceof Error ? e.message : "Galerie introuvable"); }); }, [load]);

  const setF = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string) => (e: ChangeEvent<HTMLInputElement>) => setF(k, e.target.value === "" ? null : Number(e.target.value));

  async function save(keys: string[]) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {}; keys.forEach((k) => (body[k] = (form as Record<string, unknown>)[k]));
      if ("eventDate" in body && !body.eventDate) body.eventDate = null;
      const gal = await api<Gallery>(`/galleries/manage/${id}`, { method: "PATCH", json: body });
      setG(gal); setForm((f) => ({ ...f, ...gal, eventDate: gal.eventDate ? gal.eventDate.slice(0, 10) : "", password: "" })); notify("Enregistré");
    } catch (e) { notify(e instanceof Error ? e.message : "Erreur", true); } finally { setSaving(false); }
  }

  // ─── Upload ────────────────────────────────────────────────────────────────
  /** Un envoi = 20 fichiers max côté serveur : on découpe et on enchaîne les lots. */
  const CHUNK = 20;

  function uploadChunk(files: File[], onProgress: (fraction: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("photos", f));
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress(1); resolve(); return; }
        let m = "Erreur lors de l'envoi";
        try { m = JSON.parse(xhr.responseText).message ?? m; } catch {}
        reject(new Error(m));
      };
      xhr.onerror = () => reject(new Error("Erreur réseau pendant l'envoi"));
      xhr.open("POST", `${API}/photos/gallery/${id}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
      xhr.send(fd);
    });
  }

  async function handleFiles(files: File[]) {
    if (!files.length || uploading) return;
    const previews = files.map((f) => ({ localId: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name }));
    setPending(previews);
    setUploading(true);
    setProgress(0);

    const lots: File[][] = [];
    for (let i = 0; i < files.length; i += CHUNK) lots.push(files.slice(i, i + CHUNK));

    let done = 0;
    try {
      for (const lot of lots) {
        await uploadChunk(lot, (f) => setProgress(Math.round(((done + f * lot.length) / files.length) * 100)));
        done += lot.length;
        setProgress(Math.round((done / files.length) * 100));
        if (lots.length > 1) load(); // la grille se remplit lot par lot
      }
      notify(`${files.length} photo${files.length > 1 ? "s" : ""} ajoutée${files.length > 1 ? "s" : ""}`);
    } catch (e) {
      notify(done > 0 ? `${done} photo${done > 1 ? "s" : ""} ajoutée${done > 1 ? "s" : ""}, puis : ${e instanceof Error ? e.message : "erreur"}` : e instanceof Error ? e.message : "Erreur", true);
    } finally {
      setUploading(false); setProgress(0);
      previews.forEach((p) => URL.revokeObjectURL(p.url)); setPending([]);
      load();
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))); };

  // ─── Photos ────────────────────────────────────────────────────────────────
  async function photoAction(p: Photo, action: "cover" | "unlock" | "lock" | "delete") {
    try {
      if (action === "cover") { await api(`/galleries/manage/${id}`, { method: "PATCH", json: { coverPhotoId: p.id } }); }
      if (action === "unlock") await api(`/photos/${p.id}/unlock`, { method: "PATCH" });
      if (action === "lock") await api(`/photos/${p.id}/lock`, { method: "PATCH" });
      if (action === "delete") { if (!confirm("Supprimer cette photo définitivement ?")) return; await api(`/photos/${p.id}`, { method: "DELETE" }); }
      await load();
    } catch (e) { notify(e instanceof Error ? e.message : "Erreur", true); }
  }
  async function commitPrice() {
    if (!editPrice) return;
    const price = parseInt(editPrice.v, 10); setEditPrice(null);
    if (isNaN(price) || price < 0) return;
    try { await api(`/photos/${editPrice.id}/price`, { method: "PATCH", json: { price } }); setPhotos((ps) => ps.map((p) => (p.id === editPrice.id ? { ...p, price } : p))); } catch (e) { notify(e instanceof Error ? e.message : "Erreur", true); }
  }

  // ─── Actions galerie ───────────────────────────────────────────────────────
  async function act(path: string, body?: unknown, msg?: string) {
    try { await api(`/galleries/manage/${id}/${path}`, { method: "POST", json: body }); await load(); if (msg) notify(msg); }
    catch (e) { notify(e instanceof Error ? e.message : "Erreur", true); }
  }
  async function remove() {
    if (!confirm(`Supprimer « ${g?.title} » et toutes ses photos ? Cette action est définitive.`)) return;
    try { await api(`/galleries/manage/${id}`, { method: "DELETE" }); router.push("/admin/dashboard"); } catch (e) { notify(e instanceof Error ? e.message : "Erreur", true); }
  }
  function copyLink() { if (!g) return; navigator.clipboard.writeText(`${window.location.origin}/g/${g.slug}`); setCopied(true); setTimeout(() => setCopied(false), 1800); }

  if (loadError) return (
    <AdminShell title="Galerie introuvable">
      <div className="card p-8 flex flex-col items-start gap-4 max-w-lg">
        <p className="text-ink-soft">{loadError}</p>
        <p className="help">Elle a peut-être été supprimée, ou ce lien ne correspond à aucune de vos galeries.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/dashboard" className="btn btn-primary">← Retour aux galeries</Link>
          <button onClick={() => { setLoadError(null); load().catch((e) => setLoadError(e instanceof Error ? e.message : "Galerie introuvable")); }} className="btn btn-outline">Réessayer</button>
        </div>
      </div>
    </AdminShell>
  );
  if (!g) return <AdminShell title="Galerie"><p className="meta">Chargement…</p></AdminShell>;

  const lockPrice = !!policy && !policy.rights.allowPricing;
  const lockDays = !!policy && !policy.rights.allowExpiry;
  const noAllPhotos = !!policy && !policy.rights.allowAllPhotos;
  const editablePricing = [
    "maxSelection",
    ...(lockPrice ? [] : ["extraPhotoPrice", "extensionPrice"]),
    ...(lockDays ? [] : ["expiryDays", "extensionDays"]),
    ...(lockPrice || noAllPhotos ? [] : ["allPhotosPrice"]),
  ];

  const lockedCount = photos.filter((p) => !p.unlocked).length;
  const bundleWarning =
    !!g.effective.allPhotosPrice && lockedCount > 0 &&
    g.effective.allPhotosPrice >= lockedCount * g.effective.extraPhotoPrice;

  const d = daysLeft(g.expiresAt);
  const unlocked = photos.filter((p) => p.unlocked).length;
  const included = photos.filter((p) => p.unlocked && !p.paid).length;
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/g/${g.slug}` : g.url;

  return (
    <AdminShell>
      {/* En-tête galerie */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div className="flex flex-col gap-2 min-w-0">
          <Link href="/admin/dashboard" className="tap label text-muted hover:text-terracotta">← Galeries</Link>
          <h1 className="font-serif text-4xl md:text-5xl truncate">{g.title}</h1>
          <p className="meta">
            {g.clientName && <span>{g.clientName} · </span>}
            <span className="num">{photos.length}</span> photo{photos.length > 1 ? "s" : ""} · {g.maxSelection === 0 ? "vente à l’unité" : <><span className="num">{included}</span>/<span className="num">{g.maxSelection}</span> incluses utilisées</>} · <span className="num">{unlocked}</span> déverrouillée{unlocked > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`badge ${g.isArchived ? "" : d !== null && d <= 3 ? "badge-accent" : ""}`}>{g.isArchived ? "Archivée" : d === null ? `Pas encore ouverte · ${g.expiryDays} j` : d > 0 ? `Expire dans ${d} j` : "Expirée"}</span>
          {g.hasPassword && <span className="badge">Mot de passe</span>}
          <a href={publicUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">Voir côté client</a>
          <button onClick={copyLink} className={`btn ${copied ? "btn-accent" : "btn-primary"}`}>{copied ? "Lien copié" : "Copier le lien"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 items-start">
        {/* ── Colonne réglages ── */}
        <aside className="flex flex-col gap-6">
          <Section title="Informations" hint="Visibles par le client en haut de sa galerie.">
            <Field label="Titre"><input className="input" value={form.title ?? ""} onChange={(e) => setF("title", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nom du client"><input className="input" value={form.clientName ?? ""} onChange={(e) => setF("clientName", e.target.value)} /></Field>
              <Field label="Date de séance"><input type="date" className="input num" value={(form.eventDate as string) ?? ""} onChange={(e) => setF("eventDate", e.target.value)} /></Field>
            </div>
            <Field label="Message au client" hint="Quelques mots affichés sous le titre (remerciement, consignes, délai de livraison…).">
              <textarea className="input min-h-[96px]" value={form.message ?? ""} onChange={(e) => setF("message", e.target.value)} maxLength={600} placeholder="Merci pour cette belle journée ! Choisissez vos photos préférées…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email du client"><input type="email" className="input" value={form.clientEmail ?? ""} onChange={(e) => setF("clientEmail", e.target.value)} /></Field>
              <Field label="Téléphone"><input type="tel" className="input" value={form.clientPhone ?? ""} onChange={(e) => setF("clientPhone", e.target.value)} /></Field>
            </div>
            <Field label="Langue de la galerie" hint="Interface du client : textes, boutons, dates, PayPal.">
              <select className="input" value={(form.languages as string[] | undefined)?.[0] ?? "fr"} onChange={(e) => setF("languages", [e.target.value])}>
                <option value="fr">Français</option><option value="en">English</option><option value="es">Español</option>
              </select>
            </Field>
            <div className="flex gap-3">
              <button onClick={() => save(["title", "clientName", "eventDate", "message", "clientEmail", "clientPhone", "languages"])} disabled={saving} className="btn btn-primary">Enregistrer</button>
              <button onClick={() => act("send-link", undefined, `Lien envoyé à ${g.clientEmail}`)} disabled={!g.clientEmail} className="btn btn-ghost" title={!g.clientEmail ? "Renseignez un email client" : ""}>Envoyer le lien par email</button>
            </div>
          </Section>

          <Section title="Forfait & tarifs" hint="Laissez vide pour utiliser vos valeurs par défaut (Compte).">
            {(lockPrice || lockDays || noAllPhotos) && (
              <p className="help border-l-2 border-terracotta pl-3">Certains réglages sont fixés par Track.Art pour toutes les galeries.</p>
            )}
            <Field label="Photos incluses dans le forfait" hint={form.maxSelection === 0 ? "0 = vente à l’unité : le client paie chaque photo, aucune n’est offerte." : "Nombre libre. Au-delà, chaque photo est facturée au prix ci-dessous. Mettez 0 pour vendre uniquement à l’unité."}>
              <input type="number" min={0} className="input num" value={form.maxSelection ?? 1} onChange={num("maxSelection")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix photo suppl. (€)" badge={lockPrice && <LockedBadge />} hint={lockPrice ? `Imposé : ${g.effective.extraPhotoPrice} €` : `Défaut : ${g.effective.extraPhotoPrice} €${policy ? ` · ${policy.rights.priceMin}–${policy.rights.priceMax} €` : ""}`}>
                <input type="number" min={policy?.rights.priceMin ?? 0} max={policy?.rights.priceMax} className="input num" disabled={lockPrice} value={lockPrice ? g.effective.extraPhotoPrice : form.extraPhotoPrice ?? ""} onChange={num("extraPhotoPrice")} placeholder={String(g.effective.extraPhotoPrice)} />
              </Field>
              <Field label="Validité (jours)" badge={lockDays && <LockedBadge />} hint={lockDays ? "Durée imposée par la plateforme." : policy ? `À partir de la 1re ouverture · ${policy.rights.maxExpiryDays} j max.` : "À partir de la 1re ouverture."}>
                <input type="number" min={1} max={policy?.rights.maxExpiryDays} className="input num" disabled={lockDays} value={form.expiryDays ?? 30} onChange={num("expiryDays")} />
              </Field>
              <Field label="Prolongation (€)" badge={lockPrice && <LockedBadge />} hint={`${lockPrice ? "Imposé" : "Défaut"} : ${g.effective.extensionPrice} €`}>
                <input type="number" min={policy?.rights.priceMin ?? 0} max={policy?.rights.priceMax} className="input num" disabled={lockPrice} value={lockPrice ? g.effective.extensionPrice : form.extensionPrice ?? ""} onChange={num("extensionPrice")} placeholder={String(g.effective.extensionPrice)} />
              </Field>
              <Field label="Durée prolongation (j)" badge={lockDays && <LockedBadge />} hint={`${lockDays ? "Imposé" : "Défaut"} : ${g.effective.extensionDays} j`}>
                <input type="number" min={1} className="input num" disabled={lockDays} value={lockDays ? g.effective.extensionDays : form.extensionDays ?? ""} onChange={num("extensionDays")} placeholder={String(g.effective.extensionDays)} />
              </Field>
            </div>
            <Field
              label="Prix « toutes les photos » (€)"
              badge={(lockPrice || noAllPhotos) && <LockedBadge>{noAllPhotos ? "Désactivé par Track.Art" : "Fixé par Track.Art"}</LockedBadge>}
              hint={noAllPhotos ? "L’achat groupé n’est pas proposé sur la plateforme." : `Forfait pour débloquer d’un coup toutes les photos restantes. Vide = non proposé${g.effective.allPhotosPrice ? ` (défaut : ${g.effective.allPhotosPrice} €)` : ""}.`}
            >
              <input type="number" min={policy?.rights.priceMin ?? 0} max={policy?.rights.priceMax} className="input num" disabled={lockPrice || noAllPhotos}
                value={lockPrice || noAllPhotos ? g.effective.allPhotosPrice ?? "" : form.allPhotosPrice ?? ""} onChange={num("allPhotosPrice")}
                placeholder={g.effective.allPhotosPrice ? String(g.effective.allPhotosPrice) : "Non proposé"} />
            </Field>
            {bundleWarning && (
              <p className="help border-l-2 border-terracotta pl-3">
                Attention : votre forfait « toutes les photos » ({g.effective.allPhotosPrice} €) coûte plus cher que
                les {lockedCount} photo{lockedCount > 1 ? "s" : ""} restante{lockedCount > 1 ? "s" : ""} prises à l’unité
                ({lockedCount} × {g.effective.extraPhotoPrice} € = {lockedCount * g.effective.extraPhotoPrice} €).
                Le client n’a aucune raison de le choisir.
              </p>
            )}
            <p className="help">Commission Track.Art en vigueur : <span className="num">{g.effective.commissionRate} %</span> sur chaque paiement client. Le prix d’une photo peut aussi être modifié individuellement dans la grille.</p>
            <button onClick={() => save(editablePricing)} disabled={saving} className="btn btn-primary self-start">Enregistrer</button>
          </Section>

          <Section title="Accès & protection">
            <Switch checked={!!form.allowHdDownload} onChange={(v) => { setF("allowHdDownload", v); }} label="Téléchargement HD après déblocage" hint="Désactivé : le client voit ses photos déverrouillées sans filigrane mais ne peut pas télécharger les originaux (livraison par vos soins)." />
            <div className="flex flex-col gap-2 pt-3 border-t border-line">
              <p className="subsection">Mot de passe de la galerie</p>
              <p className="help">{g.hasPassword ? "Cette galerie est protégée. Saisissez un nouveau mot de passe pour le changer." : "Optionnel : le client devra le saisir en plus du lien."}</p>
              <div className="flex gap-2">
                <input className="input" placeholder={g.hasPassword ? "Nouveau mot de passe" : "Ex. lea2026"} value={form.password ?? ""} onChange={(e) => setF("password", e.target.value)} />
                {g.hasPassword && <button onClick={() => api(`/galleries/manage/${id}`, { method: "PATCH", json: { password: null } }).then(() => { load(); notify("Mot de passe retiré"); })} className="btn btn-ghost shrink-0">Retirer</button>}
              </div>
            </div>
            <p className="help">Les previews sont toujours filigranées « {g.effective.watermarkText} » et en basse définition, et le téléchargement des previews est bloqué.</p>
            <button onClick={() => save(["allowHdDownload", ...(form.password ? ["password"] : [])])} disabled={saving} className="btn btn-primary self-start">Enregistrer</button>
          </Section>

          <Section title="Validité" hint={g.firstOpenedAt ? `Ouverte pour la première fois le ${formatDate(g.firstOpenedAt)}.` : "Le compte à rebours démarre à la première ouverture du lien par le client."}>
            {g.expiresAt && <p className="text-sm">Expire le <strong className="num">{formatDate(g.expiresAt)}</strong>{d !== null && d > 0 && <span className="meta"> · dans {d} jour{d > 1 ? "s" : ""}</span>}</p>}
            <div className="flex flex-wrap gap-2 items-end">
              <Field label="Offrir des jours"><input type="number" min={1} max={365} className="input num w-28" value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} /></Field>
              <button onClick={() => act("extend", { days: extendDays }, `Galerie prolongée de ${extendDays} jours`)} className="btn btn-outline">Prolonger gratuitement</button>
              {g.firstOpenedAt && <button onClick={() => confirm("Réinitialiser ? Le compte à rebours repartira à la prochaine ouverture.") && act("reset-expiry", undefined, "Validité réinitialisée")} className="btn btn-ghost">Réinitialiser</button>}
            </div>
            {g.extensions.length > 0 && <ul className="flex flex-col gap-1 pt-2 border-t border-line">{g.extensions.map((x) => <li key={x.id} className="meta">{formatDate(x.createdAt)} · +{x.days} j · {x.amount ? euros(x.amount) : "offert"}</li>)}</ul>}
          </Section>

          <Section title="Ventes de cette galerie">
            {g.payments.length === 0 ? <p className="help">Aucun paiement pour l’instant.</p> : (
              <ul className="flex flex-col gap-2">
                {g.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{TYPE[p.type] ?? p.type}{p.photoIds?.length ? <span className="meta"> · {p.photoIds.length} photo{p.photoIds.length > 1 ? "s" : ""}</span> : null}<span className="meta block">{formatDate(p.createdAt)}</span></span>
                    <span className="text-right"><span className="num">{euros(p.amount)}</span><span className="meta block">net {euros(p.netAmount)}</span></span>
                    <span className={`badge ${p.status === "completed" ? "badge-accent" : ""}`}>{p.status === "completed" ? "Payé" : "En attente"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Archivage & suppression">
            <Switch checked={!!form.isArchived} onChange={(v) => { setF("isArchived", v); api(`/galleries/manage/${id}`, { method: "PATCH", json: { isArchived: v } }).then(() => { load(); notify(v ? "Galerie archivée" : "Galerie réactivée"); }); }} label="Archiver la galerie" hint="Le lien client devient inaccessible ; les photos sont conservées jusqu'à l'expiration." />
            <button onClick={remove} className="btn btn-ghost text-terracotta hover:border-terracotta self-start">Supprimer définitivement</button>
          </Section>
        </aside>

        {/* ── Colonne photos ── */}
        <main className="flex flex-col gap-5">
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }} onDrop={onDrop} onClick={() => !uploading && fileRef.current?.click()}
            className={`card border-dashed cursor-pointer transition-all ${dragging ? "border-terracotta bg-sand-deep" : "hover:border-ink"}`}>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/tiff" multiple className="hidden" onChange={(e) => { handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
            <div className="py-10 flex flex-col items-center gap-3 select-none text-center px-6">
              {uploading ? (
                <>
                  <p className="label text-ink-soft">Upload et traitement en cours…</p>
                  <div className="w-56 h-1 bg-line overflow-hidden"><div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="meta">{progress} % · miniatures et filigrane générés à l'arrivée</p>
                </>
              ) : (
                <>
                  <svg className={`w-8 h-8 ${dragging ? "text-terracotta" : "text-muted"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <p className="font-serif text-2xl">{dragging ? "Déposez vos photos" : "Glissez-déposez vos photos ici"}</p>
                  <p className="meta">ou cliquez pour parcourir · JPEG, PNG, WEBP, HEIC, TIFF · 80 Mo par fichier · nombre de photos illimité</p>
                </>
              )}
            </div>
          </div>

          {(photos.length > 0 || pending.length > 0) && (
            <div className="flex items-center justify-between text-sm border-b border-line pb-3">
              <span className="meta"><span className="num text-ink">{photos.length + pending.length}</span> photos · survolez une photo pour la gérer</span>
              <span className="label text-muted">Couverture : {g.coverPhotoId ? "définie" : "1re photo"}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
            {pending.map((p) => (
              <div key={p.localId} className="relative aspect-square overflow-hidden bg-sand-deep tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-line border-t-terracotta rounded-full animate-spin" /></div>
              </div>
            ))}
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden group bg-sand-deep tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={p.filename ?? ""} className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75" loading="lazy" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {p.isCover && <span className="badge badge-ink !py-1 !px-1.5">Couverture</span>}
                  {p.unlocked && <span className={`badge !py-1 !px-1.5 ${p.paid ? "badge-accent" : ""}`} style={{ background: "#EFE6DA" }}>{p.paid ? "Payée" : "Incluse"}</span>}
                </div>
                <div className="reveal-on-hover absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-ink/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between gap-1">
                  {editPrice?.id === p.id ? (
                    <input autoFocus type="number" min={0} className="w-16 bg-sand text-ink text-xs px-1.5 py-1 outline-none text-center num" value={editPrice.v} onChange={(e) => setEditPrice({ id: p.id, v: e.target.value })} onBlur={commitPrice} onKeyDown={(e) => { if (e.key === "Enter") commitPrice(); if (e.key === "Escape") setEditPrice(null); }} />
                  ) : (
                    <button onClick={() => setEditPrice({ id: p.id, v: String(p.price) })} className="text-sand text-xs num hover:text-terracotta-soft py-2 pr-2" title="Modifier le prix">{p.price} € ✎</button>
                  )}
                  <div className="flex gap-1">
                    {!p.isCover && <IconBtn title="Définir comme couverture" onClick={() => photoAction(p, "cover")}><path d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" /></IconBtn>}
                    {p.unlocked ? <IconBtn title="Reverrouiller" onClick={() => photoAction(p, "lock")}><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></IconBtn> : <IconBtn title="Offrir (déverrouiller)" onClick={() => photoAction(p, "unlock")}><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></IconBtn>}
                    <IconBtn title="Supprimer" onClick={() => photoAction(p, "delete")}><path d="M6 6l12 12M18 6L6 18" /></IconBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {photos.length === 0 && pending.length === 0 && !uploading && <p className="py-12 text-center font-serif text-xl text-muted">Aucune photo pour l’instant — glissez-déposez pour commencer.</p>}
        </main>
      </div>
      {toast && <Toast message={toast.m} error={toast.e} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className="w-9 h-9 sm:w-8 sm:h-8 bg-sand/90 text-ink hover:bg-terracotta hover:text-sand flex items-center justify-center transition-colors">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  );
}
