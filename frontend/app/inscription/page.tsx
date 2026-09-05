"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "../components/Logo";
import { API } from "../lib/api";

export default function Inscription() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", studioName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message ?? "Erreur");
      localStorage.setItem("token", data.access_token);
      router.push("/admin/dashboard?bienvenue=1");
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-sand text-ink grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-16 relative" style={{ backgroundImage: "url(/showcase/bouquet.webp)", backgroundSize: "cover", backgroundPosition: "center" }}><div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(239,230,218,0.55) 0%, rgba(239,230,218,0.85) 100%)" }} />
        <div className="relative"><Logo size="md" /></div>
        <div className="relative flex flex-col gap-5 max-w-md">
          <p className="eyebrow text-ink">Compte photographe</p>
          <h2 className="font-serif text-5xl leading-tight text-ink">Vos galeries, votre marque, vos ventes.</h2>
          <p className="text-ink-soft leading-relaxed">Aucun frais fixe. Vous fixez le nombre de photos incluses, le prix des extras et la durée de validité, galerie par galerie. Track.Art prélève une commission uniquement sur ce que vos clients achètent en plus.</p>
        </div>
        <p className="relative meta text-ink-soft">Sans engagement · Résiliable à tout moment</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-md card p-10 flex flex-col gap-5 fade-up">
          <div className="flex flex-col gap-2 mb-2">
            <div className="lg:hidden mb-4"><Logo size="md" /></div>
            <p className="eyebrow">Inscription</p>
            <h1 className="font-serif text-4xl">Créer mon compte</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5"><span className="field-label">Prénom et nom</span><input className="input" value={form.name} onChange={set("name")} placeholder="Camille Durand" required /></label>
            <label className="flex flex-col gap-1.5"><span className="field-label">Nom du studio</span><input className="input" value={form.studioName} onChange={set("studioName")} placeholder="Studio Lumière" /></label>
          </div>
          <label className="flex flex-col gap-1.5"><span className="field-label">Email</span><input type="email" className="input" value={form.email} onChange={set("email")} placeholder="vous@studio.fr" required /></label>
          <label className="flex flex-col gap-1.5"><span className="field-label">Téléphone (optionnel)</span><input type="tel" className="input" value={form.phone} onChange={set("phone")} placeholder="+33 6 00 00 00 00" /></label>
          <label className="flex flex-col gap-1.5"><span className="field-label">Mot de passe</span><input type="password" className="input" value={form.password} onChange={set("password")} placeholder="8 caractères minimum" minLength={8} required /></label>
          {error && <p className="text-terracotta text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-accent w-full mt-2">{loading ? "Création…" : "Créer mon compte"}</button>
          <p className="help text-center">En créant un compte vous acceptez nos <Link href="/cgv" className="link-underline text-ink">conditions générales</Link> et notre <Link href="/confidentialite" className="link-underline text-ink">politique de confidentialité</Link>.</p>
          <p className="text-center text-sm text-muted">Déjà un compte ? <Link href="/admin/login" className="text-ink link-underline hover:text-terracotta">Se connecter</Link></p>
        </form>
      </div>
    </main>
  );
}
