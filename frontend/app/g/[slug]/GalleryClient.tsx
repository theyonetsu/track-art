'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Photo = {
  id: string;
  galleryId: string;
  unlocked: boolean;
  price: number;
  createdAt: string;
  watermarkUrl: string;
  originalUrl: string | null;
};

type Gallery = {
  id: string;
  title: string;
  slug: string;
  maxSelection: number;
  expiresAt: string | null;
  includedUsed: number;
  includedRemaining: number;
};

// Typage minimal du SDK PayPal chargé dynamiquement
type PayPalSdk = {
  Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> };
};

type Props = {
  gallery: Gallery;
  initialPhotos: Photo[];
  paypalClientId: string;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export default function GalleryClient({ gallery, initialPhotos, paypalClientId }: Props) {
  const router = useRouter();
  // Les props sont rafraîchies par router.refresh() après confirmation/paiement
  const photos = initialPhotos;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const days = daysUntil(gallery.expiresAt);
  const selectedCount = selected.size;
  const includedRemaining = gallery.includedRemaining;

  // Les N premières photos sélectionnées sont incluses dans le forfait,
  // les suivantes sont facturées au prix unitaire de chaque photo.
  const selectedList = photos.filter((p) => selected.has(p.id));
  const includedCount = Math.min(selectedCount, includedRemaining);
  const extraPhotos = selectedList.slice(includedRemaining);
  const extraCount = extraPhotos.length;
  const total = extraPhotos.reduce((sum, p) => sum + p.price, 0);

  const unlockedPhotos = photos.filter((p) => p.unlocked && p.originalUrl);
  const selectablePhotos = photos.filter((p) => !p.unlocked);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Sécurité basique : pas de clic droit ni de drag sur les images
  function blockContext(e: React.SyntheticEvent) {
    e.preventDefault();
  }

  function openLightbox(photo: Photo, e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-select]')) return;
    setLightbox(photo);
  }

  // Close lightbox on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightbox(null);
        setCheckoutOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentDone(true);
    setCheckoutOpen(false);
    setSelected(new Set());
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white select-none" onContextMenu={blockContext} onDragStart={blockContext}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <span className="text-xs tracking-[0.3em] uppercase text-gray-500 shrink-0">
            Track<span className="text-gray-600">.</span>Art
          </span>

          <h1 className="text-sm font-light tracking-[0.15em] truncate text-center flex-1">
            {gallery.title}
          </h1>

          <div className="shrink-0 text-right">
            {days !== null && (
              <span
                className={`text-xs tracking-widest uppercase ${
                  days <= 3 ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                {days > 0 ? `${days}j restants` : 'Expire aujourd\'hui'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Payment success banner */}
      {paymentDone && (
        <div className="bg-white text-black text-center py-3 px-4">
          <p className="text-sm font-medium tracking-wide">
            Paiement confirmé — vos photos sont déverrouillées ci-dessous
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 pt-6 pb-40">
        {/* Sub-header */}
        <div className="mb-6 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-500">
            {selectedCount > 0
              ? `${includedCount} / ${includedRemaining} incluses${extraCount > 0 ? ` · ${extraCount} supplémentaire${extraCount > 1 ? 's' : ''}` : ''}`
              : includedRemaining > 0
                ? `${includedRemaining} photo${includedRemaining > 1 ? 's' : ''} incluse${includedRemaining > 1 ? 's' : ''} dans votre forfait`
                : 'Forfait utilisé — photos supplémentaires à l\'unité'}
          </p>
        </div>

        {/* Unlocked downloads */}
        {unlockedPhotos.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              Photos déverrouillées ({unlockedPhotos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5">
              {unlockedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.watermarkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={photo.originalUrl!}
                      download
                      className="px-4 py-2 border border-white text-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Télécharger
                    </a>
                  </div>
                  <div className="absolute top-2 right-2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 tracking-wider">
                    HD
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="py-32 text-center text-gray-600 text-sm tracking-widest uppercase">
            Aucune photo dans cette galerie
          </div>
        ) : selectablePhotos.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-sm tracking-widest uppercase">
            Toutes les photos sont déverrouillées
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5">
            {selectablePhotos.map((photo) => {
              const isSelected = selected.has(photo.id);
              const selectionIndex = selectedList.findIndex((p) => p.id === photo.id);
              const isExtra = isSelected && selectionIndex >= includedRemaining;

              return (
                <button
                  key={photo.id}
                  className="relative aspect-square overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                  onClick={() => toggleSelect(photo.id)}
                  onDoubleClick={(e) => openLightbox(photo, e)}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? 'Désélectionner' : 'Sélectionner'}
                >
                  {/* Photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.watermarkUrl}
                    alt=""
                    className={`w-full h-full object-cover transition-all duration-200 ${
                      isSelected ? 'brightness-75 scale-[1.02]' : 'group-hover:brightness-90'
                    }`}
                    loading="lazy"
                    draggable={false}
                  />

                  {/* Selection overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-white pointer-events-none" />
                  )}

                  {/* Checkbox */}
                  <div
                    data-select
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white border-white'
                        : 'bg-black/40 border-white/60 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Prix : affiché si la photo est un extra (ou au survol si le forfait est épuisé) */}
                  {(isExtra || (!isSelected && includedRemaining - selectedCount <= 0)) && photo.price > 0 && (
                    <div className={`absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 transition-opacity ${isExtra ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      +{photo.price}€
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky action bar */}
      {selectedCount > 0 && !checkoutOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-light">
                <span className="text-white">{selectedCount}</span>
                <span className="text-gray-500"> photo{selectedCount > 1 ? 's' : ''}</span>
              </p>
              <p className="text-xs text-gray-400">
                {includedCount} incluse{includedCount > 1 ? 's' : ''}
                {extraCount > 0 && ` · ${extraCount} extra${extraCount > 1 ? 's' : ''} = ${total}€`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-gray-500 hover:text-white tracking-widest uppercase transition-colors"
              >
                Effacer
              </button>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="bg-white text-black px-6 py-2.5 text-xs tracking-[0.2em] uppercase font-medium hover:bg-gray-100 transition-colors"
              >
                {total > 0 ? `Payer ${total}€` : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout overlay */}
      {checkoutOpen && (
        <CheckoutDrawer
          gallery={gallery}
          selectedIds={selected}
          photos={photos}
          total={total}
          paypalClientId={paypalClientId}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none"
            onClick={() => setLightbox(null)}
            aria-label="Fermer"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.watermarkUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleSelect(lightbox.id); setLightbox(null); }}
              className={`px-6 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                selected.has(lightbox.id)
                  ? 'bg-white text-black border-white'
                  : 'text-white border-white/40 hover:border-white'
              }`}
            >
              {selected.has(lightbox.id) ? '✓ Sélectionnée' : 'Sélectionner'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Checkout drawer ───────────────────────────────────────────────────────────

type CheckoutProps = {
  gallery: Gallery;
  selectedIds: Set<string>;
  photos: Photo[];
  total: number;
  paypalClientId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function CheckoutDrawer({
  gallery,
  selectedIds,
  photos,
  total,
  paypalClientId,
  onClose,
  onSuccess,
}: CheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));

  useEffect(() => {
    if (!paypalClientId || !containerRef.current) {
      setStatus('error');
      setErrorMsg('PayPal non configuré. Renseignez PAYPAL_CLIENT_ID dans le .env.');
      return;
    }

    setStatus('loading');

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR&locale=fr_FR`;
    script.async = true;

    script.onerror = () => {
      setStatus('error');
      setErrorMsg('Impossible de charger PayPal. Vérifiez votre connexion.');
    };

    script.onload = () => {
      const win = window as unknown as { paypal?: PayPalSdk };
      if (!win.paypal || !containerRef.current) return;

      win.paypal
        .Buttons({
          style: {
            layout: 'vertical',
            color: 'white',
            shape: 'rect',
            label: 'pay',
            height: 44,
          },
          createOrder: async () => {
            setStatus('processing');
            try {
              const res = await fetch(`${API}/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  galleryId: gallery.id,
                  photoIds: Array.from(selectedIds),
                }),
              });
              if (!res.ok) throw new Error(await res.text());
              const { paypalOrderId, internalId } = await res.json();
              internalIdRef.current = internalId;
              setStatus('processing');
              return paypalOrderId;
            } catch (err) {
              setStatus('error');
              setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la création de la commande');
              throw err;
            }
          },
          onApprove: async (data: { orderID: string }) => {
            try {
              const res = await fetch(`${API}/payments/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paypalOrderId: data.orderID,
                  internalId: internalIdRef.current,
                }),
              });
              if (!res.ok) throw new Error(await res.text());
              onSuccess();
            } catch {
              setStatus('error');
              setErrorMsg('Paiement reçu mais erreur lors du déverrouillage. Contactez-nous.');
            }
          },
          onCancel: () => {
            setStatus('ready');
          },
          onError: (err: unknown) => {
            console.error('PayPal error', err);
            setStatus('error');
            setErrorMsg('Erreur PayPal. Veuillez réessayer.');
          },
        })
        .render(containerRef.current)
        .then(() => setStatus('ready'))
        .catch(() => {
          setStatus('error');
          setErrorMsg('Impossible de charger les boutons PayPal.');
        });
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Clean up PayPal from window to allow re-init on re-open
      delete (window as unknown as { paypal?: PayPalSdk }).paypal;
    };
  }, [gallery.id, paypalClientId, selectedIds, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#0a0a0a] border-t border-white/10 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-0.5 bg-white/20 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-4 max-w-lg mx-auto w-full">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm tracking-[0.2em] uppercase font-light">Votre sélection</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Photo thumbnails */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {selectedPhotos.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-16 h-16 rounded overflow-hidden border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.watermarkUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-white/10 rounded p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>{Math.min(selectedPhotos.length, gallery.includedRemaining)} photo{Math.min(selectedPhotos.length, gallery.includedRemaining) > 1 ? 's' : ''} incluse{Math.min(selectedPhotos.length, gallery.includedRemaining) > 1 ? 's' : ''}</span>
              <span>0€</span>
            </div>
            {selectedPhotos.length > gallery.includedRemaining && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>{selectedPhotos.length - gallery.includedRemaining} photo{selectedPhotos.length - gallery.includedRemaining > 1 ? 's' : ''} supplémentaire{selectedPhotos.length - gallery.includedRemaining > 1 ? 's' : ''}</span>
                <span>{total}€</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-white border-t border-white/10 pt-2">
              <span>Total</span>
              <span>{total}€</span>
            </div>
            {total === 0 && (
              <p className="text-xs text-gray-600">
                Ces photos sont incluses dans votre forfait.
              </p>
            )}
          </div>

          {/* PayPal button container or free confirm */}
          {total > 0 ? (
            <div>
              {status === 'loading' && (
                <div className="h-11 bg-white/5 animate-pulse rounded" />
              )}
              {status === 'error' && (
                <div className="text-red-400 text-xs text-center py-3">{errorMsg}</div>
              )}
              {status === 'processing' && (
                <div className="text-gray-400 text-xs text-center tracking-widest uppercase py-3">
                  Traitement en cours...
                </div>
              )}
              <div
                ref={containerRef}
                className={status === 'loading' || status === 'processing' ? 'invisible h-0' : ''}
              />
            </div>
          ) : (
            <FreeConfirmButton
              gallery={gallery}
              selectedIds={selectedIds}
              onSuccess={onSuccess}
            />
          )}

          {total > 0 && (
            <p className="text-center text-xs text-gray-600 mt-4">
              Paiement sécurisé via PayPal
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Free confirm (when total = 0) ────────────────────────────────────────────

function FreeConfirmButton({
  gallery,
  selectedIds,
  onSuccess,
}: {
  gallery: Gallery;
  selectedIds: Set<string>;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/galleries/${gallery.slug}/confirm-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Erreur lors de la confirmation');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la confirmation');
      setLoading(false);
    }
  }

  return (
    <>
    {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
    <button
      onClick={confirm}
      disabled={loading}
      className="w-full bg-white text-black py-3 text-sm tracking-[0.15em] uppercase font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? 'Confirmation...' : 'Confirmer ma sélection'}
    </button>
    </>
  );
}
