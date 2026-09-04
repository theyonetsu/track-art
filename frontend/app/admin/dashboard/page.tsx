"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function Dashboard() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [maxSelection, setMaxSelection] = useState(30);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  useEffect(() => {
    const t = localStorage.getItem("token") ?? "";
    if (!t) { router.replace("/admin/login"); return; }
    setToken(t);
  }, [router]);

  useEffect(() => { if (token) fetchGalleries(); }, [token]);

  async function fetchGalleries() {
    try {
      const res = await fetch(`${API}/galleries`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const data = await res.json();
      if (Array.isArray(data)) setGalleries(data);
    } catch (e) { console.error(e); }
  }
  async function createGallery(e: any) {
    e.preventDefault(); setLoading(true);
    await fetch(`${API}/galleries`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, clientEmail: email, maxSelection, languages: ["fr"] }) });
    setTitle(""); setEmail(""); setLoading(false); fetchGalleries();
  }
  async function deleteGallery(id: string) {
    await fetch(`${API}/galleries/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchGalleries();
  }
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-thin tracking-[0.3em] uppercase">Track.Art</h1>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/admin/login"); }} className="text-gray-500 text-xs tracking-widest uppercase hover:text-white transition-colors">Déconnexion</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-6">Nouvelle galerie</h2>
            <form onSubmit={createGallery} className="space-y-4">
              <input type="text" placeholder="Nom de la galerie" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent border border-gray-700 px-4 py-3 text-sm placeholder-gray-600 focus:border-white focus:outline-none" required />
              <input type="email" placeholder="Email client" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border border-gray-700 px-4 py-3 text-sm placeholder-gray-600 focus:border-white focus:outline-none" />
              <select value={maxSelection} onChange={e => setMaxSelection(Number(e.target.value))} className="w-full bg-black border border-gray-700 px-4 py-3 text-sm text-white focus:border-white focus:outline-none">
                <option value={15}>15 photos incluses</option>
                <option value={30}>30 photos incluses</option>
                <option value={60}>60 photos incluses</option>
              </select>
              <button type="submit" disabled={loading} className="w-full border border-white py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50">{loading ? "Création..." : "Créer"}</button>
            </form>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-6">Galeries ({galleries.length})</h2>
            <div className="space-y-3">
              {galleries.length === 0 && <p className="text-gray-600 text-sm">Aucune galerie</p>}
              {galleries.map((g: any) => (
                <div key={g.id} className="border border-gray-800 p-4 flex justify-between items-center hover:border-gray-600 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{g.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{g.photos?.length || 0} photos • {g.maxSelection} incluses</p>
                    {g.expiresAt && <p className="text-xs text-gray-600 mt-1">Expire: {new Date(g.expiresAt).toLocaleDateString("fr-FR")}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/g/${g.slug}`); }} className="text-xs text-gray-400 hover:text-white tracking-widest uppercase transition-colors">Copier lien</button>
                    <a href={`/admin/gallery/${g.id}`} className="text-xs text-gray-400 hover:text-white tracking-widest uppercase transition-colors">Gérer</a>
                    <button onClick={() => deleteGallery(g.id)} className="text-xs text-red-800 hover:text-red-400 tracking-widest uppercase transition-colors">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
