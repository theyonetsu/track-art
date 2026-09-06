"use client";
import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { Section, Field, Switch, Toast } from "../../components/ui";
import { api, euros, formatDate } from "../../lib/api";

type Users = { users: { id: string; email: string; name: string | null; studioName: string | null; role: string; createdAt: string; _count: { galleries: number; payments: number } }[]; totals: { sales: number; gross: number; fees: number; net: number } };

type Settings = {
  commissionRate: number;
  includedPhotos: number; extraPhotoPrice: number; allPhotosPrice: number | null;
  extensionPrice: number; extensionDays: number; expiryDays: number;
  allowPricing: boolean; allowExpiry: boolean; allowAllPhotos: boolean;
  priceMin: number; priceMax: number; maxExpiryDays: number;
};

export default function PlateformePage() {
  const [data, setData] = useState<Users | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);

  useEffect(() => {
    api<Users>("/admin/users").then(setData).catch((e) => setToast({ m: e.message, e: true }));
    api<Settings>("/admin/settings").then(setS).catch(() => {});
  }, []);

  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS((p) => (p ? { ...p, [k]: Number(e.target.value) } : p));

  async function save() {
    if (!s) return;
    setSaving(true);
    try { setS(await api<Settings>("/admin/settings", { method: "PATCH", json: s })); setToast({ m: "Réglages enregistrés" }); }
    catch (e) { setToast({ m: e instanceof Error ? e.message : "Erreur", e: true }); }
    finally { setSaving(false); }
  }

  return (
    <AdminShell title="Plateforme">
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 reveal-stagger is-visible">
          <div className="card p-5"><span className="field-label">Photographes</span><p className="font-serif text-3xl num">{data.users.length}</p></div>
          <div className="card p-5"><span className="field-label">Ventes</span><p className="font-serif text-3xl num">{data.totals.sales}</p></div>
          <div className="card p-5"><span className="field-label">Volume</span><p className="font-serif text-3xl num">{euros(data.totals.gross)}</p></div>
          <div className="card p-5"><span className="field-label">Commissions Track.Art</span><p className="font-serif text-3xl num text-terracotta">{euros(data.totals.fees)}</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="flex flex-col gap-6">
          {s && (
            <>
              <Section title="Valeurs par défaut" hint="Appliquées à tout photographe qui n’a rien défini de son côté, et imposées à tous si vous retirez le droit correspondant ci-dessous.">
                <Field label="Commission (%)" hint="Prélevée sur chaque paiement client. Toujours fixée par vous.">
                  <input type="number" min={0} max={100} step={0.5} className="input num" value={s.commissionRate} onChange={num("commissionRate")} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Photos incluses"><input type="number" min={1} className="input num" value={s.includedPhotos} onChange={num("includedPhotos")} /></Field>
                  <Field label="Photo supplémentaire (€)"><input type="number" min={0} className="input num" value={s.extraPhotoPrice} onChange={num("extraPhotoPrice")} /></Field>
                </div>
                <Field label="Prix « toutes les photos » (€)" hint="Forfait de déblocage global. Vide = non proposé par défaut.">
                  <input type="number" min={0} className="input num" value={s.allPhotosPrice ?? ""} placeholder="Non proposé"
                    onChange={(e) => setS({ ...s, allPhotosPrice: e.target.value === "" ? null : Number(e.target.value) })} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Validité (jours)" hint="À partir de la première ouverture."><input type="number" min={1} className="input num" value={s.expiryDays} onChange={num("expiryDays")} /></Field>
                  <Field label="Prolongation (€ / jours)">
                    <div className="flex gap-2">
                      <input type="number" min={0} className="input num" value={s.extensionPrice} onChange={num("extensionPrice")} />
                      <input type="number" min={1} className="input num" value={s.extensionDays} onChange={num("extensionDays")} />
                    </div>
                  </Field>
                </div>
              </Section>

              <Section title="Droits des photographes" hint="Ce que chaque photographe peut modifier depuis son compte. Un droit retiré impose vos valeurs à toutes les galeries, existantes comprises.">
                <Switch checked={s.allowPricing} onChange={(v) => setS({ ...s, allowPricing: v })} label="Fixer ses propres tarifs" hint="Photo supplémentaire, prolongation, achat groupé." />
                <Switch checked={s.allowExpiry} onChange={(v) => setS({ ...s, allowExpiry: v })} label="Fixer ses durées" hint="Validité de la galerie et durée de prolongation." />
                <Switch checked={s.allowAllPhotos} onChange={(v) => setS({ ...s, allowAllPhotos: v })} label="Proposer l’achat groupé" hint="Bouton « débloquer toutes les photos » côté client." />
                <div className="border-t border-line pt-5 flex flex-col gap-4">
                  <p className="subsection">Encadrement des valeurs</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prix minimum (€)"><input type="number" min={0} className="input num" value={s.priceMin} onChange={num("priceMin")} disabled={!s.allowPricing} /></Field>
                    <Field label="Prix maximum (€)"><input type="number" min={0} className="input num" value={s.priceMax} onChange={num("priceMax")} disabled={!s.allowPricing} /></Field>
                  </div>
                  <Field label="Validité maximale (jours)" hint="Plafond que le photographe ne peut pas dépasser.">
                    <input type="number" min={1} className="input num" value={s.maxExpiryDays} onChange={num("maxExpiryDays")} disabled={!s.allowExpiry} />
                  </Field>
                </div>
                <button onClick={save} disabled={saving} className="btn btn-primary self-start">{saving ? "Enregistrement…" : "Enregistrer les réglages"}</button>
              </Section>
            </>
          )}
        </div>

        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-line">{["Photographe", "Email", "Rôle", "Galeries", "Ventes", "Inscrit le"].map((h) => <th key={h} className="field-label font-normal px-5 py-4">{h}</th>)}</tr></thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-4 font-serif text-lg">{u.studioName ?? u.name ?? "—"}</td>
                  <td className="px-5 py-4 meta">{u.email}</td>
                  <td className="px-5 py-4"><span className={`badge ${u.role === "SUPERADMIN" ? "badge-ink" : ""}`}>{u.role === "SUPERADMIN" ? "Admin" : "Photographe"}</span></td>
                  <td className="px-5 py-4 num">{u._count.galleries}</td>
                  <td className="px-5 py-4 num">{u._count.payments}</td>
                  <td className="px-5 py-4 num text-muted">{formatDate(u.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <Toast message={toast.m} error={toast.e} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}
