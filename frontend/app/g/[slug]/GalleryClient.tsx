'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type Photo = {
  id: string; galleryId: string; unlocked: boolean; price: number; createdAt: string;
  watermarkUrl: string; originalUrl: string | null; isCover?: boolean; width?: number | null; height?: number | null;
};

export type Gallery = {
  id: string; title: string; slug: string; locked: boolean; maxSelection: number; expiresAt: string | null;
  includedUsed: number; includedRemaining: number; studioName: string | null; message: string | null;
  clientName: string | null; eventDate: string | null; allowHdDownload: boolean;
  extraPhotoPrice: number; extensionPrice: number; extensionDays: number;
};

type Props = { gallery: Gallery; initialPhotos: Photo[]; paypalClientId: string; accessToken?: string; onRefresh?: () => Promise<void> | void };

type PayPalSdk = { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> } };

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

// ─── Image protégée : fond CSS + calque, aucune balise <img> exposée ──────────
function ProtectedImage({ src, className = '', fit = 'cover' }: { src: string; className?: string; fit?: 'cover' | 'contain' }) {
  return (
    <div className={`relative overflow-hidden select-none ${className}`} style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <div role="img" aria-label="" className="absolute inset-0" style={{ backgroundImage: `url("${src}")`, backgroundSize: fit, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
      <div className="absolute inset-0" aria-hidden="true" />
    </div>
  );
}

const Check = ({ color = '#EFE6DA' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5 4.8 9.2 10 3.5" /></svg>
);

export default function GalleryClient({ gallery, initialPhotos, paypalClientId, accessToken = '', onRefresh }: Props) {
  const router = useRouter();
  const photos = initialPhotos;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [drawer, setDrawer] = useState<'photos' | 'extension' | null>(null);
  const [banner, setBanner] = useState<string>('');

  const days = daysUntil(gallery.expiresAt);
  const headers: Record<string, string> = accessToken ? { 'x-gallery-token': accessToken } : {};

  const selectedList = photos.filter((p) => selected.has(p.id));
  const selectedCount = selected.size;
  const includedRemaining = gallery.includedRemaining;
  const includedCount = Math.min(selectedCount, includedRemaining);
  const extraPhotos = selectedList.slice(includedRemaining);
  const total = extraPhotos.reduce((s, p) => s + p.price, 0);

  const unlockedPhotos = photos.filter((p) => p.unlocked);
  const selectablePhotos = photos.filter((p) => !p.unlocked);
  const coverUrl = (photos.find((p) => p.isCover) ?? photos[0])?.watermarkUrl ?? null;

  const lightboxList = selectablePhotos.length ? selectablePhotos : photos;
  const lightboxIndex = lightbox ? lightboxList.findIndex((p) => p.id === lightbox.id) : -1;
  const stepLightbox = useCallback((dir: 1 | -1) => {
    if (lightboxIndex < 0 || !lightboxList.length) return;
    setLightbox(lightboxList[(lightboxIndex + dir + lightboxList.length) % lightboxList.length]);
  }, [lightboxIndex, lightboxList]);

  function toggle(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setLightbox(null); setDrawer(null); }
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepLightbox]);

  const refresh = useCallback(async () => { if (onRefresh) await onRefresh(); else router.refresh(); }, [onRefresh, router]);

  const onSelectionDone = useCallback(async (paid: boolean) => {
    setDrawer(null); setSelected(new Set());
    setBanner(paid ? 'Paiement confirmé — vos photos sont déverrouillées ci-dessous.' : 'Sélection confirmée — vos photos sont disponibles ci-dessous.');
    await refresh();
  }, [refresh]);
  const onExtended = useCallback(async () => { setDrawer(null); setBanner(`Galerie prolongée de ${gallery.extensionDays} jours.`); await refresh(); }, [refresh, gallery.extensionDays]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();
  const canExtend = gallery.extensionPrice > 0 && days !== null && days <= 10;

  return (
    <div className="min-h-screen bg-sand text-ink select-none" onContextMenu={block} onDragStart={block}>
      {/* Couverture */}
      <header className="relative overflow-hidden">
        {coverUrl && <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url("${coverUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) saturate(0.9)', opacity: 0.55 }} aria-hidden="true" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(239,230,218,0.35) 0%, rgba(239,230,218,0.85) 70%, #EFE6DA 100%)' }} aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-5 pt-14 md:pt-20 pb-8 flex flex-col items-center text-center gap-3 fade-up">
          <span className="font-serif text-xs tracking-[0.32em] uppercase">Track<span className="text-terracotta">.</span>Art</span>
          <h1 className="font-serif text-4xl md:text-6xl font-normal leading-tight mt-2" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{gallery.title}</h1>
          <p className="meta">
            {gallery.studioName && <span>par {gallery.studioName}</span>}
            {gallery.studioName && gallery.eventDate && <span> · </span>}
            {gallery.eventDate && <span>{fmtDate(gallery.eventDate)}</span>}
          </p>
          {gallery.message && <p className="font-serif italic text-lg md:text-xl text-ink-soft max-w-2xl mt-2 leading-snug">« {gallery.message} »</p>}
        </div>
      </header>

      {banner && <div className="bg-terracotta text-sand text-center py-3 px-4 fade-up"><p className="text-sm tracking-wide">{banner}</p></div>}

      <main className="max-w-7xl mx-auto px-5 pt-2 pb-40">
        {/* Compteur + expiration */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 card">
          <p className="text-sm">
            {selectedCount > 0
              ? <><span className="num">{includedCount}</span> / <span className="num">{includedRemaining}</span> incluses{extraCount(extraPhotos.length)}</>
              : includedRemaining > 0
                ? <><span className="num">{includedRemaining}</span> photo{includedRemaining > 1 ? 's' : ''} incluse{includedRemaining > 1 ? 's' : ''} dans votre forfait</>
                : <>Forfait utilisé — photos supplémentaires à <span className="num">{gallery.extraPhotoPrice} €</span> l’unité</>}
          </p>
          <div className="flex items-center gap-4">
            {days !== null && <span className="label text-terracotta">{days > 0 ? `Expire dans ${days} jour${days > 1 ? 's' : ''}` : 'Expire aujourd’hui'}</span>}
            {canExtend && <button onClick={() => setDrawer('extension')} className="btn btn-ghost !min-h-0 !py-2">Prolonger · {gallery.extensionPrice} €</button>}
          </div>
        </div>

        {/* Photos déverrouillées */}
        {unlockedPhotos.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-2xl">Vos photos {gallery.allowHdDownload ? 'HD' : 'confirmées'} <span className="text-muted text-lg num">({unlockedPhotos.length})</span></h2>
              {!gallery.allowHdDownload && <span className="meta">Les fichiers HD vous seront remis par votre photographe.</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 reveal-stagger is-visible">
              {unlockedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-[4/5] overflow-hidden tile bg-sand-deep">
                  <ProtectedImage src={photo.watermarkUrl} className="w-full h-full" />
                  {photo.originalUrl && (
                    <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={photo.originalUrl} download className="btn btn-outline border-sand text-sand hover:bg-sand hover:text-ink" onClick={(e) => e.stopPropagation()}>Télécharger</a>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 badge" style={{ background: '#EFE6DA' }}>{photo.originalUrl ? 'HD' : 'OK'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grille de sélection */}
        {photos.length === 0 ? (
          <div className="py-32 text-center font-serif text-2xl text-muted">Les photos arrivent bientôt.</div>
        ) : selectablePhotos.length === 0 ? (
          <div className="py-16 text-center font-serif text-2xl text-muted">Toutes les photos sont déverrouillées.</div>
        ) : (
          <>
            <h2 className="font-serif text-2xl mb-4">Choisissez vos photos <span className="text-muted text-lg num">({selectablePhotos.length})</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 reveal-stagger is-visible">
              {selectablePhotos.map((photo) => {
                const isSelected = selected.has(photo.id);
                const idx = selectedList.findIndex((p) => p.id === photo.id);
                const isExtra = isSelected && idx >= includedRemaining;
                return (
                  <button key={photo.id} onClick={() => toggle(photo.id)} onDoubleClick={() => setLightbox(photo)} aria-pressed={isSelected} aria-label={isSelected ? 'Désélectionner' : 'Sélectionner'}
                    className={`relative aspect-[4/5] overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer bg-sand-deep tile ${isSelected ? 'ring-2 ring-terracotta ring-offset-2 ring-offset-sand' : ''}`}>
                    <ProtectedImage src={photo.watermarkUrl} className={`w-full h-full transition-all duration-200 ${isSelected ? 'brightness-90 scale-[1.03]' : 'group-hover:brightness-95'}`} />
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-terracotta border-terracotta' : 'bg-ink/30 border-sand/80 opacity-0 group-hover:opacity-100'}`}>{isSelected && <Check />}</div>
                    <span role="button" tabIndex={-1} aria-label="Agrandir" onClick={(e) => { e.stopPropagation(); setLightbox(photo); }} className="absolute bottom-2 right-2 w-8 h-8 bg-sand/90 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink hover:text-sand">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></svg>
                    </span>
                    {(isExtra || (!isSelected && includedRemaining - selectedCount <= 0)) && photo.price > 0 && (
                      <div className={`absolute bottom-2 left-2 badge transition-opacity ${isExtra ? 'opacity-100 badge-accent' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: '#EFE6DA' }}>+{photo.price} €</div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Barre d'action */}
      {selectedCount > 0 && !drawer && (
        <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-line slide-up" style={{ boxShadow: '0 -12px 40px -16px rgba(34,27,24,0.35)' }}>
          <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-medium"><span className="num">{selectedCount}</span> <span className="text-muted font-light">photo{selectedCount > 1 ? 's' : ''}</span></p>
              <p className="meta"><span className="num">{includedCount}</span> incluse{includedCount > 1 ? 's' : ''}{extraPhotos.length > 0 && <> · <span className="num">{extraPhotos.length}</span> extra{extraPhotos.length > 1 ? 's' : ''} = <span className="num">{total} €</span></>}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setSelected(new Set())} className="label text-muted hover:text-terracotta transition-colors">Effacer</button>
              <button onClick={() => setDrawer('photos')} className="btn btn-primary">{total > 0 ? `Payer ${total} €` : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {drawer === 'photos' && (
        <Drawer title="Votre sélection" onClose={() => setDrawer(null)}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {selectedList.map((p) => <div key={p.id} className="shrink-0 w-16 h-16 overflow-hidden border border-line"><ProtectedImage src={p.watermarkUrl} className="w-full h-full" /></div>)}
          </div>
          <div className="border border-line p-4 mb-6 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-ink-soft"><span><span className="num">{includedCount}</span> photo{includedCount > 1 ? 's' : ''} incluse{includedCount > 1 ? 's' : ''}</span><span className="num">0 €</span></div>
            {extraPhotos.length > 0 && <div className="flex justify-between text-ink-soft"><span><span className="num">{extraPhotos.length}</span> photo{extraPhotos.length > 1 ? 's' : ''} supplémentaire{extraPhotos.length > 1 ? 's' : ''}</span><span className="num">{total} €</span></div>}
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium"><span>Total</span><span className="num">{total} €</span></div>
            {total === 0 && <p className="help">Ces photos sont incluses dans votre forfait.</p>}
          </div>
          {total > 0
            ? <PayPalButtons paypalClientId={paypalClientId} create={async () => {
                const res = await fetch(`${API}/payments/create-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ galleryId: gallery.id, photoIds: Array.from(selected) }) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur lors de la création de la commande');
                return res.json();
              }} onDone={() => onSelectionDone(true)} />
            : <FreeConfirm slug={gallery.slug} ids={Array.from(selected)} headers={headers} onDone={() => onSelectionDone(false)} />}
        </Drawer>
      )}

      {drawer === 'extension' && (
        <Drawer title="Prolonger la galerie" onClose={() => setDrawer(null)}>
          <div className="border border-line p-4 mb-6 flex flex-col gap-2 text-sm">
            <p className="text-ink-soft">Votre galerie expire {days !== null && days > 0 ? `dans ${days} jour${days > 1 ? 's' : ''}` : 'aujourd’hui'}. Prolongez-la de <strong className="num">{gallery.extensionDays} jours</strong> pour garder le temps de choisir.</p>
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium"><span>Prolongation</span><span className="num">{gallery.extensionPrice} €</span></div>
          </div>
          <PayPalButtons paypalClientId={paypalClientId} create={async () => {
            const res = await fetch(`${API}/payments/create-extension-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ galleryId: gallery.id }) });
            if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur lors de la création de la commande');
            return res.json();
          }} onDone={onExtended} />
        </Drawer>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center fade-in" onClick={() => setLightbox(null)}>
          {lightboxList.length > 1 && (
            <>
              <button className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-sand/70 hover:text-sand border border-sand/20 hover:border-sand/60 transition-colors" onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }} aria-label="Photo précédente"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
              <button className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-sand/70 hover:text-sand border border-sand/20 hover:border-sand/60 transition-colors" onClick={(e) => { e.stopPropagation(); stepLightbox(1); }} aria-label="Photo suivante"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
              <span className="absolute top-5 left-1/2 -translate-x-1/2 label text-sand/60 num">{lightboxIndex + 1} / {lightboxList.length}</span>
            </>
          )}
          <button className="absolute top-4 right-4 text-sand/70 hover:text-sand text-3xl leading-none" onClick={() => setLightbox(null)} aria-label="Fermer">×</button>
          <div onClick={(e) => e.stopPropagation()} className="h-[82vh] w-[86vw] md:w-[80vw]"><ProtectedImage src={lightbox.watermarkUrl} fit="contain" className="h-full w-full" /></div>
          {!lightbox.unlocked && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button onClick={(e) => { e.stopPropagation(); toggle(lightbox.id); }} className={`btn ${selected.has(lightbox.id) ? 'btn-accent' : 'border-sand/60 text-sand hover:border-sand'}`}>{selected.has(lightbox.id) ? 'Sélectionnée' : 'Sélectionner'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function extraCount(n: number) {
  return n > 0 ? <> · <span className="num">{n}</span> supplémentaire{n > 1 ? 's' : ''}</> : null;
}

// ─── Tiroir ───────────────────────────────────────────────────────────────────
function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-sand border-t border-line w-full max-h-[85vh] overflow-y-auto slide-up" style={{ boxShadow: '0 -24px 60px -20px rgba(34,27,24,0.5)' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-0.5 bg-line rounded-full" /></div>
        <div className="px-5 pb-8 pt-4 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-6"><h2 className="font-serif text-2xl">{title}</h2><button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none transition-colors" aria-label="Fermer">×</button></div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation gratuite ────────────────────────────────────────────────────
function FreeConfirm({ slug, ids, headers, onDone }: { slug: string; ids: string[]; headers: Record<string, string>; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function confirm() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/galleries/${slug}/confirm-selection`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ photoIds: ids }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur lors de la confirmation');
      onDone();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); setLoading(false); }
  }
  return (
    <>
      {error && <p className="text-terracotta text-sm text-center mb-3">{error}</p>}
      <button onClick={confirm} disabled={loading} className="btn btn-primary w-full">{loading ? 'Confirmation…' : 'Confirmer ma sélection'}</button>
    </>
  );
}

// ─── Boutons PayPal ───────────────────────────────────────────────────────────
function PayPalButtons({ paypalClientId, create, onDone }: { paypalClientId: string; create: () => Promise<{ paypalOrderId: string; internalId: string }>; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalId = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  // Les callbacks changent à chaque rendu du parent : on les garde dans des refs pour ne charger le SDK qu'une fois.
  const createRef = useRef(create); createRef.current = create;
  const doneRef = useRef(onDone); doneRef.current = onDone;

  useEffect(() => {
    if (!paypalClientId || !ref.current) { setStatus('error'); setMsg('Le paiement en ligne n’est pas encore activé sur cette galerie. Contactez votre photographe.'); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR&locale=fr_FR`;
    script.async = true;
    script.onerror = () => { setStatus('error'); setMsg('Impossible de charger PayPal. Vérifiez votre connexion.'); };
    script.onload = () => {
      const win = window as unknown as { paypal?: PayPalSdk };
      if (!win.paypal || !ref.current) return;
      win.paypal.Buttons({
        style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 44 },
        createOrder: async () => {
          setStatus('processing');
          try { const { paypalOrderId, internalId: id } = await createRef.current(); internalId.current = id; return paypalOrderId; }
          catch (err) { setStatus('error'); setMsg(err instanceof Error ? err.message : 'Erreur'); throw err; }
        },
        onApprove: async (data: { orderID: string }) => {
          try {
            const res = await fetch(`${API}/payments/capture-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paypalOrderId: data.orderID, internalId: internalId.current }) });
            if (!res.ok) throw new Error(await res.text());
            doneRef.current();
          } catch { setStatus('error'); setMsg('Paiement reçu mais erreur lors de la validation. Contactez votre photographe.'); }
        },
        onCancel: () => setStatus('ready'),
        onError: () => { setStatus('error'); setMsg('Erreur PayPal. Veuillez réessayer.'); },
      }).render(ref.current).then(() => setStatus('ready')).catch(() => { setStatus('error'); setMsg('Impossible d’afficher les boutons PayPal.'); });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); delete (window as unknown as { paypal?: PayPalSdk }).paypal; };
  }, [paypalClientId]);

  return (
    <div>
      {status === 'loading' && <div className="h-11 bg-sand-deep animate-pulse" />}
      {status === 'error' && <div className="text-terracotta text-sm text-center py-3">{msg}</div>}
      {status === 'processing' && <div className="label text-muted text-center py-3">Traitement en cours…</div>}
      <div ref={ref} className={status === 'loading' || status === 'processing' ? 'invisible h-0' : ''} />
      <p className="text-center text-xs text-muted mt-4">Paiement sécurisé via PayPal · cartes bancaires acceptées</p>
    </div>
  );
}
