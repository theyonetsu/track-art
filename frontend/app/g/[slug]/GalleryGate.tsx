'use client';

import { useEffect, useState } from 'react';
import GalleryClient, { type Gallery, type Photo } from './GalleryClient';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Porte d'entrée : si la galerie est protégée, demande le mot de passe,
 * obtient un jeton d'accès (14 jours, gardé dans le navigateur) puis charge la galerie.
 */
export default function GalleryGate({ slug, initialGallery, initialPhotos, paypalClientId }: { slug: string; initialGallery: Gallery; initialPhotos: Photo[]; paypalClientId: string }) {
  const key = `trackart:${slug}`;
  const [token, setToken] = useState<string>('');
  const [gallery, setGallery] = useState<Gallery>(initialGallery);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(initialGallery.locked);

  async function loadWithToken(t: string) {
    const res = await fetch(`${API}/galleries/${slug}`, { headers: { 'x-gallery-token': t }, cache: 'no-store' });
    if (!res.ok) throw new Error('Accès refusé');
    const g: Gallery = await res.json();
    if (g.locked) throw new Error('Accès refusé');
    const ph = await fetch(`${API}/photos/gallery/${g.id}`, { headers: { 'x-gallery-token': t }, cache: 'no-store' }).then((r) => (r.ok ? r.json() : []));
    setGallery(g); setPhotos(ph); setToken(t);
  }

  // Jeton déjà présent (visite précédente) ?
  useEffect(() => {
    if (!initialGallery.locked) return;
    let saved = '';
    try { saved = sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? ''; } catch {}
    if (!saved) { setChecking(false); return; }
    loadWithToken(saved).catch(() => { try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch {} }).finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/galleries/${slug}/access`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Mot de passe incorrect');
      try { localStorage.setItem(key, data.token); } catch {}
      await loadWithToken(data.token);
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); } finally { setLoading(false); }
  }

  if (!gallery.locked) return <GalleryClient key={gallery.id} gallery={gallery} initialPhotos={photos} paypalClientId={paypalClientId} accessToken={token} onRefresh={token ? () => loadWithToken(token) : undefined} />;

  return (
    <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6 grain">
      <form onSubmit={submit} className="w-full max-w-sm card p-10 flex flex-col gap-6 fade-up text-center">
        <p className="font-serif text-xs tracking-[0.32em] uppercase">Track<span className="text-terracotta">.</span>Art</p>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl leading-tight">{gallery.title}</h1>
          {gallery.studioName && <p className="meta">par {gallery.studioName}</p>}
        </div>
        <p className="text-sm text-ink-soft">Cette galerie est privée. Saisissez le mot de passe transmis par votre photographe.</p>
        {checking ? <p className="meta">Vérification…</p> : (
          <>
            <input type="password" className="input text-center tracking-[0.3em]" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
            {error && <p className="text-terracotta text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Ouverture…' : 'Ouvrir la galerie'}</button>
          </>
        )}
      </form>
    </main>
  );
}
