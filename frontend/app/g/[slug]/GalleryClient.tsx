'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDict, LOCALE, PAYPAL_LOCALE, type Dict, type Lang } from './i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type Photo = {
  id: string; galleryId: string; unlocked: boolean; price: number; createdAt: string;
  watermarkUrl: string; originalUrl: string | null; filename?: string | null; isCover?: boolean; width?: number | null; height?: number | null;
};

export type Gallery = {
  id: string; title: string; slug: string; locked: boolean; maxSelection: number; expiresAt: string | null;
  includedUsed: number; includedRemaining: number; studioName: string | null; message: string | null;
  clientName: string | null; eventDate: string | null; allowHdDownload: boolean;
  extraPhotoPrice: number; extensionPrice: number; extensionDays: number;
  allPhotosPrice?: number | null; lockedCount?: number; languages?: string[];
};

type Props = { gallery: Gallery; initialPhotos: Photo[]; paypalClientId: string; accessToken?: string; onRefresh?: () => Promise<void> | void };

type PayPalSdk = { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> } };

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string | null, lang: Lang = 'fr') {
  return d ? new Date(d).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

// ─── Image protégée : fond CSS + calque, aucune balise <img> exposée ──────────
function ProtectedImage({ src, className = '', fit = 'cover' }: { src: string; className?: string; fit?: 'cover' | 'contain' }) {
  return (
    <div className={`relative overflow-hidden select-none ${className}`} style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <div
        role="img"
        aria-label=""
        className="absolute inset-0"
        style={{
          // Repli discret si l'aperçu met du temps à arriver ou ne charge pas
          backgroundColor: 'var(--color-sand-deep)',
          backgroundImage: `url("${src}"), linear-gradient(160deg, #E8D9C9, #D9BFA8)`,
          backgroundSize: `${fit}, cover`,
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat',
          pointerEvents: 'none',
        }}
      />
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
  const [drawer, setDrawer] = useState<'photos' | 'extension' | 'all' | null>(null);
  const { lang, t } = getDict(gallery.languages);
  const [methods, setMethods] = useState<{ paypal: boolean; card: boolean }>({ paypal: !!paypalClientId, card: false });
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

  // Moyens de paiement réellement configurés sur le serveur
  useEffect(() => {
    fetch(`${API}/payments/methods`).then((r) => (r.ok ? r.json() : null)).then((m) => m && setMethods(m)).catch(() => {});
  }, []);

  // Retour depuis la page de paiement par carte : on confirme puis on nettoie l'URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('paiement');
    if (!p) return;
    const clean = () => window.history.replaceState({}, '', window.location.pathname);
    if (p === 'annule') { setBanner(t.canceled); clean(); return; }
    if (!p.startsWith('cs_')) return;
    setBanner(t.checkingPayment);
    fetch(`${API}/payments/stripe/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: p }) })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? 'Erreur');
        setBanner(t.paidBanner);
        clean();
        await refresh();
      })
      .catch((e) => { setBanner(e instanceof Error ? e.message : 'Erreur'); clean(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectionDone = useCallback(async (paid: boolean) => {
    setDrawer(null); setSelected(new Set());
    setBanner(paid ? t.paidBanner : t.freeBanner);
    await refresh();
  }, [refresh, t]);
  const onAllDone = useCallback(async () => { setDrawer(null); setSelected(new Set()); setBanner(t.allBanner); await refresh(); }, [refresh, t]);
  const onExtended = useCallback(async () => { setDrawer(null); setBanner(t.extendedBanner(gallery.extensionDays)); await refresh(); }, [refresh, gallery.extensionDays, t]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();
  const canExtend = gallery.extensionPrice > 0 && days !== null && days <= 10;
  const canBuyAll = !!gallery.allPhotosPrice && gallery.allPhotosPrice > 0 && selectablePhotos.length > 0;
  const downloadable = unlockedPhotos.filter((p) => p.originalUrl);

  // Téléchargement de tous les fichiers ORIGINAUX, un par un (pas d'archive) :
  // chaque URL signée renvoie le fichier tel qu'uploadé, avec son nom, en pièce jointe.
  const [dl, setDl] = useState<{ i: number; n: number } | null>(null);
  async function downloadAll() {
    if (dl || !downloadable.length) return;
    for (let i = 0; i < downloadable.length; i++) {
      const p = downloadable[i];
      setDl({ i: i + 1, n: downloadable.length });
      const a = document.createElement('a');
      a.href = p.originalUrl!;
      a.download = p.filename ?? '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise((r) => setTimeout(r, 700));
    }
    setDl(null);
  }

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
            {gallery.studioName && <span>{t.by} {gallery.studioName}</span>}
            {gallery.studioName && gallery.eventDate && <span> · </span>}
            {gallery.eventDate && <span>{fmtDate(gallery.eventDate, lang)}</span>}
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
              ? <><span className="num">{includedCount}</span> / <span className="num">{includedRemaining}</span> {t.includedShort}{extraPhotos.length > 0 && <> · {t.extra(extraPhotos.length)}</>}</>
              : includedRemaining > 0
                ? <>{t.included(includedRemaining)}</>
                : <>{t.packUsed(gallery.extraPhotoPrice)}</>}
          </p>
          <div className="flex items-center gap-4">
            {days !== null && <span className="label text-terracotta">{t.expiresIn(days)}</span>}
            {canExtend && <button onClick={() => setDrawer('extension')} className="btn btn-ghost !min-h-0 !py-2">{t.extend} · {gallery.extensionPrice} €</button>}
          </div>
        </div>

        {/* Photos déverrouillées */}
        {unlockedPhotos.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-4">
              <h2 className="font-serif text-2xl">{t.yourPhotos} {gallery.allowHdDownload ? t.hd : t.confirmed} <span className="text-muted text-lg num">({unlockedPhotos.length})</span></h2>
              {!gallery.allowHdDownload && <span className="meta">{t.hdByPhotographer}</span>}
              {downloadable.length > 1 && <span className="meta hidden md:inline">{t.downloadHint}</span>}
              {downloadable.length > 1 && (
                <button onClick={downloadAll} disabled={!!dl} className="btn btn-outline self-start shrink-0">
                  {dl ? t.downloading(dl.i, dl.n) : t.downloadAll(downloadable.length)}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 reveal-stagger is-visible">
              {unlockedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-[4/5] overflow-hidden tile bg-sand-deep">
                  <ProtectedImage src={photo.watermarkUrl} className="w-full h-full" />
                  {photo.originalUrl && (
                    <>
                      {/* Souris : recouvrement au survol */}
                      <div className="hover-only absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center flex">
                        <a href={photo.originalUrl} download={photo.filename ?? ''} className="btn btn-outline border-sand text-sand" onClick={(e) => e.stopPropagation()}>{t.download}</a>
                      </div>
                      {/* Tactile : bouton toujours visible */}
                      <a
                        href={photo.originalUrl}
                        download={photo.filename ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t.download}
                        className="touch-only absolute bottom-2 left-2 w-11 h-11 items-center justify-center bg-sand/95 text-ink"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></svg>
                      </a>
                    </>
                  )}
                  <div className="absolute top-2 right-2 badge" style={{ background: '#EFE6DA' }}>{photo.originalUrl ? 'HD' : 'OK'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grille de sélection */}
        {photos.length === 0 ? (
          <div className="py-32 text-center font-serif text-2xl text-muted">{t.soon}</div>
        ) : selectablePhotos.length === 0 ? (
          <div className="py-16 text-center font-serif text-2xl text-muted">{t.allUnlocked}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-serif text-2xl">{t.choose} <span className="text-muted text-lg num">({selectablePhotos.length})</span></h2>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setSelected(new Set(selectablePhotos.map((p) => p.id)))} className="label text-muted hover:text-terracotta transition-colors">{t.selectAll}</button>
                {canBuyAll && <button onClick={() => setDrawer('all')} className="btn btn-accent !min-h-0 !py-2.5">{t.unlockAll(selectablePhotos.length, gallery.allPhotosPrice!)}</button>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 reveal-stagger is-visible">
              {selectablePhotos.map((photo) => {
                const isSelected = selected.has(photo.id);
                const idx = selectedList.findIndex((p) => p.id === photo.id);
                const isExtra = isSelected && idx >= includedRemaining;
                return (
                  <button key={photo.id} onClick={() => toggle(photo.id)} onDoubleClick={() => setLightbox(photo)} aria-pressed={isSelected} aria-label={isSelected ? t.selected : t.select}
                    className={`relative aspect-[4/5] overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer bg-sand-deep tile ${isSelected ? 'ring-2 ring-terracotta ring-offset-2 ring-offset-sand' : ''}`}>
                    <ProtectedImage src={photo.watermarkUrl} className={`w-full h-full transition-all duration-200 ${isSelected ? 'brightness-90 scale-[1.03]' : 'group-hover:brightness-95'}`} />
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-terracotta border-terracotta' : 'bg-ink/30 border-sand/80 opacity-0 group-hover:opacity-100 reveal-on-hover'}`}>{isSelected && <Check />}</div>
                    <span role="button" tabIndex={-1} aria-label={t.zoom} onClick={(e) => { e.stopPropagation(); setLightbox(photo); }} className="reveal-on-hover absolute bottom-2 right-2 w-11 h-11 sm:w-9 sm:h-9 bg-sand/90 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink hover:text-sand">
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
              <p className="text-base font-medium"><span className="num">{selectedCount}</span> <span className="text-muted font-light">{t.photo(selectedCount)}</span></p>
              <p className="meta">{t.includedLine(includedCount)}{extraPhotos.length > 0 && <> · {t.extraLine(extraPhotos.length)} = <span className="num">{total} €</span></>}</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setSelected(new Set())} className="label text-muted hover:text-terracotta transition-colors">{t.clear}</button>
              <button onClick={() => setDrawer('photos')} className="btn btn-primary">{total > 0 ? t.pay(total) : t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {drawer === 'photos' && (
        <Drawer title={t.selection} onClose={() => setDrawer(null)} closeLabel={t.close}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {selectedList.map((p) => <div key={p.id} className="shrink-0 w-16 h-16 overflow-hidden border border-line"><ProtectedImage src={p.watermarkUrl} className="w-full h-full" /></div>)}
          </div>
          <div className="border border-line p-4 mb-6 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-ink-soft"><span>{t.includedLine(includedCount)}</span><span className="num">0 €</span></div>
            {extraPhotos.length > 0 && <div className="flex justify-between text-ink-soft"><span>{t.extraLine(extraPhotos.length)}</span><span className="num">{total} €</span></div>}
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium"><span>{t.total}</span><span className="num">{total} €</span></div>
            {total === 0 && <p className="help">{t.includedNote}</p>}
          </div>
          {total > 0 ? (
            <div className="flex flex-col gap-4">
              {methods.card && <CardButton t={t} kind="photos" galleryId={gallery.id} photoIds={Array.from(selected)} headers={headers} amount={total} />}
              {methods.card && methods.paypal && <p className="meta text-center">{t.orPaypal}</p>}
              {methods.paypal && (
                <PayPalButtons t={t} lang={lang} paypalClientId={paypalClientId} create={async () => {
                  const res = await fetch(`${API}/payments/create-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ galleryId: gallery.id, photoIds: Array.from(selected) }) });
                  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur lors de la création de la commande');
                  return res.json();
                }} onDone={() => onSelectionDone(true)} />
              )}
              {!methods.card && !methods.paypal && <p className="text-terracotta text-sm text-center">{t.noPay}</p>}
            </div>
          ) : (
            <FreeConfirm t={t} slug={gallery.slug} ids={Array.from(selected)} headers={headers} onDone={() => onSelectionDone(false)} />
          )}
        </Drawer>
      )}

      {drawer === 'extension' && (
        <Drawer title={t.extendTitle} onClose={() => setDrawer(null)} closeLabel={t.close}>
          <div className="border border-line p-4 mb-6 flex flex-col gap-2 text-sm">
            <p className="text-ink-soft">{t.extendText(days, gallery.extensionDays)}</p>
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium"><span>{t.extension}</span><span className="num">{gallery.extensionPrice} €</span></div>
          </div>
          <div className="flex flex-col gap-4">
            {methods.card && <CardButton t={t} kind="extension" galleryId={gallery.id} headers={headers} amount={gallery.extensionPrice} />}
            {methods.card && methods.paypal && <p className="meta text-center">{t.orPaypal}</p>}
            {methods.paypal && (
              <PayPalButtons t={t} lang={lang} paypalClientId={paypalClientId} create={async () => {
                const res = await fetch(`${API}/payments/create-extension-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ galleryId: gallery.id }) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur lors de la création de la commande');
                return res.json();
              }} onDone={onExtended} />
            )}
            {!methods.card && !methods.paypal && <p className="text-terracotta text-sm text-center">{t.noPay}</p>}
          </div>
        </Drawer>
      )}

      {drawer === 'all' && (
        <Drawer title={t.allTitle} onClose={() => setDrawer(null)} closeLabel={t.close}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {selectablePhotos.slice(0, 12).map((p) => <div key={p.id} className="shrink-0 w-16 h-16 overflow-hidden border border-line"><ProtectedImage src={p.watermarkUrl} className="w-full h-full" /></div>)}
            {selectablePhotos.length > 12 && <div className="shrink-0 w-16 h-16 border border-line flex items-center justify-center num text-sm text-muted">+{selectablePhotos.length - 12}</div>}
          </div>
          <div className="border border-line p-4 mb-6 flex flex-col gap-2 text-sm">
            <p className="text-ink-soft">{t.allText(selectablePhotos.length)}</p>
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium"><span>{t.allLine(selectablePhotos.length)}</span><span className="num">{gallery.allPhotosPrice} €</span></div>
          </div>
          <div className="flex flex-col gap-4">
            {methods.card && <CardButton t={t} kind="all" galleryId={gallery.id} headers={headers} amount={gallery.allPhotosPrice!} />}
            {methods.card && methods.paypal && <p className="meta text-center">{t.orPaypal}</p>}
            {methods.paypal && (
              <PayPalButtons t={t} lang={lang} paypalClientId={paypalClientId} create={async () => {
                const res = await fetch(`${API}/payments/create-all-photos-order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ galleryId: gallery.id }) });
                if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Erreur');
                return res.json();
              }} onDone={onAllDone} />
            )}
            {!methods.card && !methods.paypal && <p className="text-terracotta text-sm text-center">{t.noPay}</p>}
          </div>
        </Drawer>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center fade-in" onClick={() => setLightbox(null)}>
          {lightboxList.length > 1 && (
            <>
              <button className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-sand/70 hover:text-sand border border-sand/20 hover:border-sand/60 transition-colors" onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }} aria-label={t.prev}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
              <button className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-sand/70 hover:text-sand border border-sand/20 hover:border-sand/60 transition-colors" onClick={(e) => { e.stopPropagation(); stepLightbox(1); }} aria-label={t.next}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
              <span className="absolute top-5 left-1/2 -translate-x-1/2 label text-sand/60 num">{lightboxIndex + 1} / {lightboxList.length}</span>
            </>
          )}
          <button className="absolute top-4 right-4 text-sand/70 hover:text-sand text-3xl leading-none" onClick={() => setLightbox(null)} aria-label={t.close}>×</button>
          <div onClick={(e) => e.stopPropagation()} className="h-[82vh] w-[86vw] md:w-[80vw]"><ProtectedImage src={lightbox.watermarkUrl} fit="contain" className="h-full w-full" /></div>
          {!lightbox.unlocked && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <button onClick={(e) => { e.stopPropagation(); toggle(lightbox.id); }} className={`btn ${selected.has(lightbox.id) ? 'btn-accent' : 'border-sand/60 text-sand hover:border-sand'}`}>{selected.has(lightbox.id) ? t.selected : t.select}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Paiement par carte (Stripe Checkout) ────────────────────────────────────
function CardButton({ t, kind, galleryId, photoIds, headers, amount }: { t: Dict; kind: 'photos' | 'all' | 'extension'; galleryId: string; photoIds?: string[]; headers: Record<string, string>; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/payments/stripe/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ kind, galleryId, photoIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message ?? 'Erreur');
      window.location.href = data.url;
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={pay} disabled={loading} className="btn btn-primary w-full">
        {loading ? t.redirecting : `${t.payCard} · ${amount} €`}
      </button>
      <p className="help text-center">{t.cardHint}</p>
      {error && <p className="text-terracotta text-sm text-center">{error}</p>}
    </div>
  );
}

// ─── Tiroir ───────────────────────────────────────────────────────────────────
function Drawer({ title, onClose, children, closeLabel = 'Fermer' }: { title: string; onClose: () => void; children: React.ReactNode; closeLabel?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-sand border-t border-line w-full max-h-[85vh] overflow-y-auto slide-up" style={{ boxShadow: '0 -24px 60px -20px rgba(34,27,24,0.5)' }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-0.5 bg-line rounded-full" /></div>
        <div className="px-5 pb-8 pt-4 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-6"><h2 className="font-serif text-2xl">{title}</h2><button onClick={onClose} className="text-muted hover:text-ink text-2xl leading-none transition-colors" aria-label={closeLabel}>×</button></div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation gratuite ────────────────────────────────────────────────────
function FreeConfirm({ t, slug, ids, headers, onDone }: { t: Dict; slug: string; ids: string[]; headers: Record<string, string>; onDone: () => void }) {
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
      <button onClick={confirm} disabled={loading} className="btn btn-primary w-full">{loading ? t.confirming : t.confirmSel}</button>
    </>
  );
}

// ─── Boutons PayPal ───────────────────────────────────────────────────────────
function PayPalButtons({ t, lang, paypalClientId, create, onDone }: { t: Dict; lang: Lang; paypalClientId: string; create: () => Promise<{ paypalOrderId: string; internalId: string }>; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalId = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  // Les callbacks changent à chaque rendu du parent : on les garde dans des refs pour ne charger le SDK qu'une fois.
  const createRef = useRef(create);
  const doneRef = useRef(onDone);
  useEffect(() => { createRef.current = create; doneRef.current = onDone; });

  useEffect(() => {
    if (!paypalClientId || !ref.current) { setStatus('error'); setMsg(t.noPay); return; }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR&locale=${PAYPAL_LOCALE[lang]}`;
    script.async = true;
    script.onerror = () => { setStatus('error'); setMsg(t.ppLoad); };
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
          } catch { setStatus('error'); setMsg(t.ppValid); }
        },
        onCancel: () => setStatus('ready'),
        onError: () => { setStatus('error'); setMsg(t.ppErr); },
      }).render(ref.current).then(() => setStatus('ready')).catch(() => { setStatus('error'); setMsg(t.ppBtn); });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); delete (window as unknown as { paypal?: PayPalSdk }).paypal; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalClientId, lang]);

  return (
    <div>
      {status === 'loading' && <div className="h-11 bg-sand-deep animate-pulse" />}
      {status === 'error' && <div className="text-terracotta text-sm text-center py-3">{msg}</div>}
      {status === 'processing' && <div className="label text-muted text-center py-3">{t.processing}</div>}
      <div ref={ref} className={status === 'loading' || status === 'processing' ? 'invisible h-0' : ''} />
      <p className="text-center text-xs text-muted mt-4">{t.secure}</p>
    </div>
  );
}
