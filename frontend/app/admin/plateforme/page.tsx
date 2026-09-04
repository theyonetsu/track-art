"use client";
import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { Section, Field, Toast } from "../../components/ui";
import { api, euros, formatDate } from "../../lib/api";

type Users = { users: { id: string; email: string; name: string | null; studioName: string | null; role: string; createdAt: string; _count: { galleries: number; payments: number } }[]; totals: { sales: number; gross: number; fees: number; net: number } };
type Settings = { commissionRate: number; extraPhotoPrice: number; extensionPrice: number; extensionDays: number };

export default function PlateformePage() {
  const [data, setData] = useState<Users | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);

  useEffect(() => {
    api<Users>("/admin/users").then(setData).catch((e) => setToast({ m: e.message, e: true }));
    api<Settings>("/admin/settings").then(setSettings).catch(() => {});
  }, []);

  async function save() {
    if (!settings) return;
    try { setSettings(await api<Settings>("/admin/settings", { method: "PATCH", json: settings })); setToast({ m: "Réglages enregistrés" }); }
    catch (e) { setToast({ m: e instanceof Error ? e.message : "Erreur", e: true }); }
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
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <Section title="Réglages plateforme" hint="S'appliquent à tous les photographes qui n'ont pas défini leurs propres valeurs.">
          {settings && (
            <>
              <Field label="Commission (%)" hint="Prélevée sur chaque paiement client."><input type="number" min={0} max={100} step={0.5} className="input num" value={settings.commissionRate} onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })} /></Field>
              <Field label="Prix photo supplémentaire par défaut (€)"><input type="number" min={0} className="input num" value={settings.extraPhotoPrice} onChange={(e) => setSettings({ ...settings, extraPhotoPrice: Number(e.target.value) })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prolongation (€)"><input type="number" min={0} className="input num" value={settings.extensionPrice} onChange={(e) => setSettings({ ...settings, extensionPrice: Number(e.target.value) })} /></Field>
                <Field label="Durée (jours)"><input type="number" min={1} className="input num" value={settings.extensionDays} onChange={(e) => setSettings({ ...settings, extensionDays: Number(e.target.value) })} /></Field>
              </div>
              <button onClick={save} className="btn btn-primary self-start">Enregistrer</button>
            </>
          )}
        </Section>
        <div className="card overflow-x-auto">
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
