"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../../components/AdminShell";
import { api, euros, formatDate } from "../../lib/api";

type Payment = { id: string; type: string; amount: number; platformFee: number; netAmount: number; commissionRate: number; status: string; createdAt: string; photoIds: string[]; gallery: { id: string; title: string; clientName: string | null } };

const TYPE: Record<string, string> = { BuyExtraPhotos: "Photos supplémentaires", ExtendGallery: "Prolongation", photos: "Photos supplémentaires" };
const STATUS: Record<string, string> = { completed: "Payé", pending: "En attente" };

export default function VentesPage() {
  const [rows, setRows] = useState<Payment[] | null>(null);
  useEffect(() => { api<Payment[]>("/payments/mine").then(setRows).catch(() => setRows([])); }, []);
  const done = (rows ?? []).filter((r) => r.status === "completed");
  const gross = done.reduce((s, r) => s + r.amount, 0), net = done.reduce((s, r) => s + r.netAmount, 0);

  return (
    <AdminShell title="Ventes">
      <div className="grid grid-cols-3 gap-4 mb-8 reveal-stagger is-visible">
        <div className="card p-5"><span className="field-label">Paiements</span><p className="font-serif text-3xl num">{done.length}</p></div>
        <div className="card p-5"><span className="field-label">Encaissé</span><p className="font-serif text-3xl num">{euros(gross)}</p></div>
        <div className="card p-5"><span className="field-label">Net pour vous</span><p className="font-serif text-3xl num">{euros(net)}</p></div>
      </div>
      <div className="card table-scroll">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b border-line">{["Date", "Galerie", "Type", "Montant", "Commission", "Net", "Statut"].map((h) => <th key={h} className="field-label font-normal px-5 py-4">{h}</th>)}</tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={7} className="px-5 py-8 meta">Chargement…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center font-serif text-xl text-muted">Aucune vente pour l’instant.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-white/30 transition-colors">
                <td className="px-5 py-4 num text-muted">{formatDate(r.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                <td className="px-5 py-4"><Link href={`/admin/gallery/${r.gallery.id}`} className="font-serif text-lg hover:text-terracotta">{r.gallery.title}</Link>{r.gallery.clientName && <span className="meta block">{r.gallery.clientName}</span>}</td>
                <td className="px-5 py-4">{TYPE[r.type] ?? r.type}{r.photoIds?.length ? <span className="meta block">{r.photoIds.length} photo{r.photoIds.length > 1 ? "s" : ""}</span> : null}</td>
                <td className="px-5 py-4 num">{euros(r.amount)}</td>
                <td className="px-5 py-4 num text-muted">{euros(r.platformFee)} <span className="meta">({r.commissionRate} %)</span></td>
                <td className="px-5 py-4 num font-medium">{euros(r.netAmount)}</td>
                <td className="px-5 py-4"><span className={`badge ${r.status === "completed" ? "badge-accent" : ""}`}>{STATUS[r.status] ?? r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
