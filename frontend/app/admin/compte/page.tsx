"use client";
import { useEffect, useState, useCallback } from "react";
import AdminShell from "../../components/AdminShell";
import { Section, Field, Toast, Stat, usePolicy, LockedBadge } from "../../components/ui";
import { api, euros } from "../../lib/api";

type Me = {
  id: string; email: string; role: string; name: string | null; studioName: string | null; phone: string | null; website: string | null;
  watermarkText: string | null; totpEnabled: boolean;
  defaultIncluded: number; defaultExtraPhotoPrice: number; defaultExtensionPrice: number; defaultExtensionDays: number; defaultExpiryDays: number; defaultAllPhotosPrice: number | null;
  stats: { galleries: number; sales: number; gross: number; net: number; fees: number };
};

export default function ComptePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState<Partial<Me>>({});
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [twofa, setTwofa] = useState<{ qr: string } | null>(null);
  const [totp, setTotp] = useState("");
  const policy = usePolicy();

  const load = useCallback(async () => { const m = await api<Me>("/me"); setMe(m); setForm(m); }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const set = (k: keyof Me) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  async function save(keys: (keyof Me)[]) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {}; keys.forEach((k) => (body[k] = form[k]));
      const m = await api<Me>("/me", { method: "PATCH", json: body }); setMe(m); setForm(m); setToast({ m: "Enregistré" });
    } catch (err) { setToast({ m: err instanceof Error ? err.message : "Erreur", e: true }); } finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) { setToast({ m: "Les mots de passe ne correspondent pas", e: true }); return; }
    try { await api("/auth/change-password", { method: "POST", json: { current: pw.current, next: pw.next } }); setPw({ current: "", next: "", confirm: "" }); setToast({ m: "Mot de passe modifié" }); }
    catch (err) { setToast({ m: err instanceof Error ? err.message : "Erreur", e: true }); }
  }

  async function setup2fa() { try { setTwofa(await api<{ qr: string }>("/auth/setup-2fa", { method: "POST" })); } catch (err) { setToast({ m: err instanceof Error ? err.message : "Erreur", e: true }); } }
  async function verify2fa(e: React.FormEvent) {
    e.preventDefault();
    try { await api("/auth/verify-2fa", { method: "POST", json: { token: totp } }); setTwofa(null); setTotp(""); setToast({ m: "Double authentification activée" }); load(); }
    catch (err) { setToast({ m: err instanceof Error ? err.message : "Code invalide", e: true }); }
  }

  if (!me) return <AdminShell title="Mon compte"><p className="meta">Chargement…</p></AdminShell>;

  const lockPrice = !!policy && !policy.rights.allowPricing;
  const lockDays = !!policy && !policy.rights.allowExpiry;
  const noAllPhotos = !!policy && !policy.rights.allowAllPhotos;
  const priceHint = lockPrice ? undefined : policy ? `Entre ${policy.rights.priceMin} € et ${policy.rights.priceMax} €.` : undefined;
  const editableDefaults: (keyof Me)[] = [
    "defaultIncluded",
    ...(lockPrice ? [] : (["defaultExtraPhotoPrice", "defaultExtensionPrice"] as (keyof Me)[])),
    ...(lockDays ? [] : (["defaultExpiryDays", "defaultExtensionDays"] as (keyof Me)[])),
    ...(lockPrice || noAllPhotos ? [] : (["defaultAllPhotosPrice"] as (keyof Me)[])),
  ];

  return (
    <AdminShell title="Mon compte">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 reveal-stagger is-visible">
        <Stat label="Galeries" value={me.stats.galleries} />
        <Stat label="Ventes" value={me.stats.sales} sub="paiements confirmés" />
        <Stat label="Chiffre d'affaires" value={euros(me.stats.gross)} sub="payé par vos clients" />
        <Stat label="Net pour vous" value={euros(me.stats.net)} sub={`après ${euros(me.stats.fees)} de commission`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Section title="Identité" hint="Ce que vos clients voient en ouvrant une galerie et dans les emails.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom et nom"><input className="input" value={form.name ?? ""} onChange={set("name")} /></Field>
            <Field label="Nom du studio" hint="Affiché sous le titre de chaque galerie."><input className="input" value={form.studioName ?? ""} onChange={set("studioName")} placeholder="Studio Lumière" /></Field>
            <Field label="Téléphone"><input className="input" value={form.phone ?? ""} onChange={set("phone")} /></Field>
            <Field label="Site web"><input className="input" value={form.website ?? ""} onChange={set("website")} placeholder="https://" /></Field>
          </div>
          <Field label="Texte du filigrane" hint="Répété sur toutes les previews. Vide = nom du studio, sinon TRACK.ART. S'applique aux prochains uploads.">
            <input className="input" value={form.watermarkText ?? ""} onChange={set("watermarkText")} placeholder={me.studioName ?? "TRACK.ART"} maxLength={40} />
          </Field>
          <button onClick={() => save(["name", "studioName", "phone", "website", "watermarkText"])} disabled={saving} className="btn btn-primary self-start">Enregistrer</button>
        </Section>

        <Section title="Réglages par défaut" hint="Pré-remplis à chaque nouvelle galerie. Modifiables ensuite galerie par galerie.">
          {policy && (!policy.rights.allowPricing || !policy.rights.allowExpiry || !policy.rights.allowAllPhotos) && (
            <p className="help border-l-2 border-terracotta pl-3">Certains réglages sont fixés par Track.Art et ne sont pas modifiables ici.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Photos incluses" hint="Nombre libre, sans limite.">
              <input type="number" min={1} className="input num" value={form.defaultIncluded ?? 30} onChange={set("defaultIncluded")} />
            </Field>
            <Field label="Prix photo supplémentaire (€)" badge={lockPrice && <LockedBadge />} hint={priceHint}>
              <input type="number" min={0} className="input num" disabled={lockPrice} value={lockPrice ? policy!.defaults.extraPhotoPrice : form.defaultExtraPhotoPrice ?? 2} onChange={set("defaultExtraPhotoPrice")} />
            </Field>
            <Field label="Validité de la galerie (jours)" badge={lockDays && <LockedBadge />} hint={lockDays ? undefined : policy ? `À partir de la première ouverture. ${policy.rights.maxExpiryDays} jours maximum.` : "À partir de la première ouverture du lien."}>
              <input type="number" min={1} max={policy?.rights.maxExpiryDays} className="input num" disabled={lockDays} value={lockDays ? policy!.defaults.expiryDays : form.defaultExpiryDays ?? 30} onChange={set("defaultExpiryDays")} />
            </Field>
            <Field label="Prolongation (€ / jours)" badge={(lockPrice || lockDays) && <LockedBadge />}>
              <div className="flex gap-2">
                <input type="number" min={0} className="input num" disabled={lockPrice} value={lockPrice ? policy!.defaults.extensionPrice : form.defaultExtensionPrice ?? 5} onChange={set("defaultExtensionPrice")} />
                <input type="number" min={1} className="input num" disabled={lockDays} value={lockDays ? policy!.defaults.extensionDays : form.defaultExtensionDays ?? 7} onChange={set("defaultExtensionDays")} />
              </div>
            </Field>
          </div>
          <Field
            label="Prix « toutes les photos » (€)"
            badge={(lockPrice || noAllPhotos) && <LockedBadge>{noAllPhotos ? "Désactivé par Track.Art" : "Fixé par Track.Art"}</LockedBadge>}
            hint={noAllPhotos ? "L’achat groupé n’est pas proposé sur la plateforme." : "Forfait pour débloquer d’un coup toutes les photos restantes d’une galerie. Vide = non proposé."}
          >
            <input type="number" min={0} className="input num" disabled={lockPrice || noAllPhotos}
              value={lockPrice || noAllPhotos ? policy!.defaults.allPhotosPrice ?? "" : form.defaultAllPhotosPrice ?? ""}
              onChange={(e) => setForm({ ...form, defaultAllPhotosPrice: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="Non proposé" />
          </Field>
          <button onClick={() => save(editableDefaults)} disabled={saving} className="btn btn-primary self-start">Enregistrer</button>
        </Section>

        <Section title="Sécurité" hint={`Connecté en tant que ${me.email}`}>
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <Field label="Mot de passe actuel"><input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nouveau mot de passe"><input type="password" className="input" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></Field>
              <Field label="Confirmer"><input type="password" className="input" minLength={8} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></Field>
            </div>
            <button type="submit" className="btn btn-outline self-start">Changer le mot de passe</button>
          </form>
          <div className="border-t border-line pt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div><p className="subsection">Double authentification</p><p className="help">Code à 6 chiffres via Google Authenticator ou équivalent.</p></div>
              {me.totpEnabled ? <span className="badge badge-accent">Activée</span> : <button onClick={setup2fa} className="btn btn-ghost">Activer</button>}
            </div>
            {twofa && (
              <form onSubmit={verify2fa} className="flex flex-col sm:flex-row gap-4 items-center card p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={twofa.qr} alt="QR code 2FA" className="w-36 h-36" />
                <div className="flex flex-col gap-3 flex-1">
                  <p className="help">Scannez ce code avec votre application, puis saisissez le code affiché.</p>
                  <input className="input num text-center tracking-[0.4em]" placeholder="123456" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value)} />
                  <button type="submit" className="btn btn-primary">Valider</button>
                </div>
              </form>
            )}
          </div>
        </Section>

        <Section title="Commission Track.Art" hint="Comment vous êtes rémunéré.">
          <p className="text-sm leading-relaxed text-ink-soft">Track.Art ne facture aucun abonnement. Sur chaque paiement de vos clients (photos supplémentaires, prolongations), la plateforme prélève une commission ; le reste vous revient. Le détail de chaque vente est dans l’onglet <span className="label">Ventes</span>.</p>
          <p className="help">Le pourcentage en vigueur est indiqué sur chaque vente. Les versements sont effectués selon les modalités précisées dans nos conditions.</p>
        </Section>
      </div>
      {toast && <Toast message={toast.m} error={toast.e} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}
