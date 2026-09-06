"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { Section, Field, Switch, Toast } from "../../components/ui";
import { api, euros, formatDate, formatTime } from "../../lib/api";

type Row = {
  id: string; email: string; name: string | null; studioName: string | null; role: string; createdAt: string;
  galleries: number; activeGalleries: number; openedGalleries: number; photos: number;
  sales: number; gross: number; fees: number; net: number; lastActivity: string | null;
};
type Day = { date: string; signups: number; galleries: number; sales: number; gross: number; fees: number };
type Stats = {
  totals: {
    users: number; photographers: number; galleries: number; activeGalleries: number; openedGalleries: number;
    photos: number; sales: number; gross: number; fees: number; net: number; averageBasket: number; conversion: number; openRate: number;
  };
  byType: Record<string, { count: number; gross: number }>;
  days: Day[];
  users: Row[];
  generatedAt: string;
};

type Settings = {
  commissionRate: number;
  includedPhotos: number; extraPhotoPrice: number; allPhotosPrice: number | null;
  extensionPrice: number; extensionDays: number; expiryDays: number;
  allowPricing: boolean; allowExpiry: boolean; allowAllPhotos: boolean;
  priceMin: number; priceMax: number; maxExpiryDays: number;
};

/** Séries des 30 derniers jours, dessinées à la main (aucune dépendance). */
const SERIES = [
  { key: "gross", label: "Volume", unit: "€" },
  { key: "fees", label: "Vos commissions", unit: "€" },
  { key: "sales", label: "Ventes", unit: "" },
  { key: "galleries", label: "Galeries créées", unit: "" },
  { key: "signups", label: "Inscriptions", unit: "" },
] as const;

function Chart({ days, metric }: { days: Day[]; metric: (typeof SERIES)[number] }) {
  const values = days.map((d) => d[metric.key] as number);
  const max = Math.max(1, ...values);
  const fmt = (n: number) => (metric.unit === "€" ? euros(n) : String(n));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-[3px] h-40" role="img" aria-label={`${metric.label} sur 30 jours`}>
        {days.map((d) => {
          const v = d[metric.key] as number;
          return (
            <div key={d.date} className="group relative flex-1 flex items-end h-full">
              <div
                className="w-full bg-terracotta/25 group-hover:bg-terracotta transition-colors duration-200"
                style={{ height: `${Math.max(v > 0 ? 4 : 1.5, (v / max) * 100)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-ink text-sand text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {formatDate(d.date, { day: "numeric", month: "short" })} · {fmt(v)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between meta">
        <span>{formatDate(days[0]?.date, { day: "numeric", month: "long" })}</span>
        <span className="num">max {fmt(max)}</span>
        <span>aujourd’hui</span>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "studioName", label: "Photographe" },
  { key: "createdAt", label: "Inscrit le" },
  { key: "galleries", label: "Galeries" },
  { key: "photos", label: "Photos" },
  { key: "sales", label: "Ventes" },
  { key: "gross", label: "Volume" },
  { key: "fees", label: "Votre part" },
  { key: "lastActivity", label: "Dernière activité" },
] as const;

export default function PlateformePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ m: string; e?: boolean } | null>(null);
  const [metric, setMetric] = useState<(typeof SERIES)[number]>(SERIES[0]);
  const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: "gross", desc: true });

  const [statsError, setStatsError] = useState<string | null>(null);
  const load = useCallback(
    () => api<Stats>("/admin/stats").then((d) => { setStats(d); setStatsError(null); }).catch((e) => setStatsError(e instanceof Error ? e.message : "Statistiques indisponibles")),
    [],
  );

  useEffect(() => {
    load();
    api<Settings>("/admin/settings").then(setS).catch(() => {});
    const t = setInterval(load, 30000); // suivi en continu
    return () => clearInterval(t);
  }, [load]);

  const rows = useMemo(() => {
    if (!stats) return [];
    const dir = sort.desc ? -1 : 1;
    return [...stats.users].sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sort.key];
      const vb = (b as unknown as Record<string, unknown>)[sort.key];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }, [stats, sort]);

  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS((p) => (p ? { ...p, [k]: Number(e.target.value) } : p));

  async function save() {
    if (!s) return;
    setSaving(true);
    try { setS(await api<Settings>("/admin/settings", { method: "PATCH", json: s })); setToast({ m: "Réglages enregistrés" }); }
    catch (e) { setToast({ m: e instanceof Error ? e.message : "Erreur", e: true }); }
    finally { setSaving(false); }
  }

  const t = stats?.totals;

  return (
    <AdminShell
      title="Plateforme"
      actions={
        <button onClick={() => load()} className="btn btn-ghost">
          {stats ? `Actualisé à ${formatTime(stats.generatedAt)}` : "Chargement…"}
        </button>
      }
    >
      {statsError && (
        <div className="card p-8 flex flex-col items-start gap-3 mb-6">
          <p className="font-serif text-2xl text-terracotta">Les statistiques n’ont pas pu être chargées.</p>
          <p className="help">{statsError}</p>
          <button onClick={() => load()} className="btn btn-outline">Réessayer</button>
        </div>
      )}
      {!stats && !statsError && <p className="meta mb-6">Chargement des statistiques…</p>}

      {t && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 reveal-stagger is-visible">
            <div className="card p-5"><span className="field-label">Photographes</span><p className="font-serif text-3xl num">{t.photographers}</p><span className="meta">{t.users} compte{t.users > 1 ? "s" : ""} au total</span></div>
            <div className="card p-5"><span className="field-label">Galeries</span><p className="font-serif text-3xl num">{t.galleries}</p><span className="meta">{t.activeGalleries} actives · {t.photos} photos</span></div>
            <div className="card p-5"><span className="field-label">Volume encaissé</span><p className="font-serif text-3xl num">{euros(t.gross)}</p><span className="meta">{t.sales} vente{t.sales > 1 ? "s" : ""}</span></div>
            <div className="card p-5"><span className="field-label">Vos commissions</span><p className="font-serif text-3xl num text-terracotta">{euros(t.fees)}</p><span className="meta">{euros(t.net)} reversés</span></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-5"><span className="field-label">Panier moyen</span><p className="font-serif text-2xl num">{euros(t.averageBasket)}</p></div>
            <div className="card p-5"><span className="field-label">Comptes qui vendent</span><p className="font-serif text-2xl num">{t.conversion.toFixed(0)} %</p><span className="meta">au moins une vente</span></div>
            <div className="card p-5"><span className="field-label">Galeries ouvertes</span><p className="font-serif text-2xl num">{t.openRate.toFixed(0)} %</p><span className="meta">{t.openedGalleries} lien{t.openedGalleries > 1 ? "s" : ""} ouvert{t.openedGalleries > 1 ? "s" : ""}</span></div>
            <div className="card p-5"><span className="field-label">Photos par galerie</span><p className="font-serif text-2xl num">{t.galleries ? Math.round(t.photos / t.galleries) : 0}</p><span className="meta">en moyenne</span></div>
          </div>
        </>
      )}

      {stats && (
        <section className="card p-6 mb-6 flex flex-col gap-5">
          <header className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-line">
            <div>
              <h2 className="font-serif text-2xl">30 derniers jours</h2>
              <p className="help">Survolez une barre pour le détail du jour.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SERIES.map((x) => (
                <button key={x.key} onClick={() => setMetric(x)} className={`tap label px-3 py-2 border transition-colors ${metric.key === x.key ? "border-terracotta text-terracotta" : "border-line text-ink-soft hover:text-ink"}`}>{x.label}</button>
              ))}
            </div>
          </header>
          <Chart days={stats.days} metric={metric} />
        </section>
      )}

      {stats && (
      <div className="card table-scroll mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-line">
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-5 py-4">
                  <button onClick={() => setSort((p) => ({ key: c.key, desc: p.key === c.key ? !p.desc : true }))} className="field-label font-normal hover:text-terracotta transition-colors whitespace-nowrap min-h-11 inline-flex items-center">
                    {c.label}{sort.key === c.key && <span className="text-terracotta"> {sort.desc ? "↓" : "↑"}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center font-serif text-xl text-muted">Aucun compte pour l’instant.</td></tr>}
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-4">
                  <p className="font-serif text-lg leading-tight">{u.studioName ?? u.name ?? "—"}</p>
                  <p className="meta">{u.email}{u.role === "SUPERADMIN" && <span className="badge badge-ink ml-2 text-[10px]">Vous</span>}</p>
                </td>
                <td className="px-5 py-4 num text-muted whitespace-nowrap">{formatDate(u.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                <td className="px-5 py-4 num">{u.galleries}<span className="meta"> · {u.activeGalleries} act.</span></td>
                <td className="px-5 py-4 num">{u.photos}</td>
                <td className="px-5 py-4 num">{u.sales}</td>
                <td className="px-5 py-4 num">{euros(u.gross)}</td>
                <td className="px-5 py-4 num text-terracotta">{euros(u.fees)}</td>
                <td className="px-5 py-4 meta whitespace-nowrap">{u.lastActivity ? formatDate(u.lastActivity, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {s && (
            <>
              <Section title="Valeurs par défaut" hint="Appliquées à tout photographe qui n’a rien défini de son côté, et imposées à tous si vous retirez le droit correspondant ci-dessous.">
                <Field label="Commission (%)" hint="Prélevée sur chaque paiement client. Toujours fixée par vous.">
                  <input type="number" min={0} max={100} step={0.5} className="input num" value={s.commissionRate} onChange={num("commissionRate")} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Photos incluses" hint="0 = vente à l’unité."><input type="number" min={0} className="input num" value={s.includedPhotos} onChange={num("includedPhotos")} /></Field>
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
                  <p className="help">Bornes appliquées quand le droit correspondant est accordé. Toujours modifiables : elles reprennent effet dès que vous réactivez le droit.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prix minimum (€)" hint={s.allowPricing ? undefined : "Sans effet : les tarifs sont fixés par vous."}>
                      <input type="number" min={0} className="input num" value={s.priceMin} onChange={num("priceMin")} />
                    </Field>
                    <Field label="Prix maximum (€)">
                      <input type="number" min={0} className="input num" value={s.priceMax} onChange={num("priceMax")} />
                    </Field>
                  </div>
                  <Field label="Validité maximale (jours)" hint={s.allowExpiry ? "Plafond que le photographe ne peut pas dépasser." : "Sans effet : les durées sont fixées par vous."}>
                    <input type="number" min={1} className="input num" value={s.maxExpiryDays} onChange={num("maxExpiryDays")} />
                  </Field>
                </div>
                <button onClick={save} disabled={saving} className="btn btn-primary self-start">{saving ? "Enregistrement…" : "Enregistrer les réglages"}</button>
              </Section>
            </>
          )}
      </div>
      {toast && <Toast message={toast.m} error={toast.e} onDone={() => setToast(null)} />}
    </AdminShell>
  );
}
