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
    <div className="min-h-screen bg-sand text-ink select-none" onContextMenu={blockContext} onDragStart={blockContext}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-5 pt-12 pb-4 flex flex-col items-center text-center gap-2 fade-up">
        <span className="font-serif text-xs tracking-[0.32em] uppercase">
          Track<span className="text-terracotta">.</span>Art
        </span>
        <h1 className="font-serif text-4xl md:text-5xl font-normal leading-tight mt-2">
          {gallery.title}
        </h1>
        <p className="label text-muted">Votre sélection de photos</p>
      </header>

      {/* Payment success banner */}
      {paymentDone && (
        <div className="bg-terracotta text-sand text-center py-3 px-4">
          <p className="text-sm tracking-wide">
            Sélection confirmée — vos photos HD sont disponibles ci-dessous
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-5 pt-2 pb-40">
        {/* Compteur + expiration */}
        <div className="mb-5 flex items-center justify-between gap-4 py-3 border-y border-line">
          <p className="text-sm">
            {selectedCount > 0
              ? `${includedCount} / ${includedRemaining} incluses${extraCount > 0 ? ` · ${extraCount} supplémentaire${extraCount > 1 ? 's' : ''}` : ''}`
              : includedRemaining > 0
                ? `${includedRemaining} photo${includedRemaining > 1 ? 's' : ''} incluse${includedRemaining > 1 ? 's' : ''} dans votre forfait`
                : 'Forfait utilisé — photos supplémentaires à l\'unité'}
          </p>
          {days !== null && (
            <span className={`label shrink-0 ${days <= 3 ? 'text-terracotta' : 'text-terracotta'}`}>
              {days > 0 ? `Expire dans ${days} jour${days > 1 ? 's' : ''}` : 'Expire aujourd\'hui'}
            </span>
          )}
        </div>

        {/* Unlocked downloads */}
        {unlockedPhotos.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-2xl mb-4">
              Vos photos HD <span className="text-muted text-lg">({unlockedPhotos.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {unlockedPhotos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.watermarkUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={photo.originalUrl!}
                      download
                      className="btn btn-outline border-sand text-sand hover:bg-sand hover:text-ink"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Télécharger
                    </a>
                  </div>
                  <div className="absolute top-2 right-2 bg-sand text-ink text-[10px] tracking-[0.16em] px-2 py-1">
                    HD
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="py-32 text-center font-serif text-2xl text-muted">
            Aucune photo dans cette galerie
          </div>
        ) : selectablePhotos.length === 0 ? (
          <div className="py-16 text-center font-serif text-2xl text-muted">
            Toutes les photos sont déverrouillées
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {selectablePhotos.map((photo) => {
              const isSelected = selected.has(photo.id);
              const selectionIndex = selectedList.findIndex((p) => p.id === photo.id);
              const isExtra = isSelected && selectionIndex >= includedRemaining;

              return (
                <button
                  key={photo.id}
                  className="relative aspect-[4/5] overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer bg-sand-deep"
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
                      isSelected ? 'brightness-90 scale-[1.03]' : 'group-hover:brightness-95'
                    }`}
                    loading="lazy"
                    draggable={false}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                  />

                  {/* Selection overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-terracotta pointer-events-none" />
                  )}

                  {/* Checkbox */}
                  <div
                    data-select
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-terracotta border-terracotta'
                        : 'bg-ink/30 border-sand/80 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-sand" fill="currentColor" viewBox="0 0 20 20">
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
                    <div className={`absolute bottom-2 left-2 bg-sand/95 text-ink text-[11px] px-2 py-1 tracking-wide transition-opacity ${isExtra ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
        <div className="fixed bottom-0 inset-x-0 z-40 bg-sand/95 backdrop-blur border-t border-line">
          <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-medium">
                <span className="text-ink">{selectedCount}</span>
                <span className="text-muted font-light"> photo{selectedCount > 1 ? 's' : ''}</span>
              </p>
              <p className="text-xs text-muted">
                {includedCount} incluse{includedCount > 1 ? 's' : ''}
                {extraCount > 0 && ` · ${extraCount} extra${extraCount > 1 ? 's' : ''} = ${total}€`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(new Set())}
                className="label text-muted hover:text-terracotta transition-colors"
              >
                Effacer
              </button>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="btn btn-primary"
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
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-sand/70 hover:text-sand text-3xl leading-none"
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
              className={`btn ${
                selected.has(lightbox.id)
                  ? 'btn-accent'
                  : 'border-sand/60 text-sand hover:border-sand'
              }`}
            >
              {selected.has(lightbox.id) ? 'Sélectionnée' : 'Sélectionner'}
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
            color: 'black',
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
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-sand border-t border-line w-full max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-0.5 bg-line rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-4 max-w-lg mx-auto w-full">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl">Votre sélection</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Photo thumbnails */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {selectedPhotos.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-16 h-16 overflow-hidden border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.watermarkUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-line p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>{Math.min(selectedPhotos.length, gallery.includedRemaining)} photo{Math.min(selectedPhotos.length, gallery.includedRemaining) > 1 ? 's' : ''} incluse{Math.min(selectedPhotos.length, gallery.includedRemaining) > 1 ? 's' : ''}</span>
              <span>0€</span>
            </div>
            {selectedPhotos.length > gallery.includedRemaining && (
              <div className="flex justify-between text-sm text-ink-soft">
                <span>{selectedPhotos.length - gallery.includedRemaining} photo{selectedPhotos.length - gallery.includedRemaining > 1 ? 's' : ''} supplémentaire{selectedPhotos.length - gallery.includedRemaining > 1 ? 's' : ''}</span>
                <span>{total}€</span>
              </div>
            )}
            <div className="flex justify-between text-base text-ink border-t border-line pt-2 font-medium">
              <span>Total</span>
              <span>{total}€</span>
            </div>
            {total === 0 && (
              <p className="text-xs text-muted">
                Ces photos sont incluses dans votre forfait.
              </p>
            )}
          </div>

          {/* PayPal button container or free confirm */}
          {total > 0 ? (
            <div>
              {status === 'loading' && (
                <div className="h-11 bg-sand-deep animate-pulse" />
              )}
              {status === 'error' && (
                <div className="text-terracotta text-sm text-center py-3">{errorMsg}</div>
              )}
              {status === 'processing' && (
                <div className="label text-muted text-center py-3">
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
            <p className="text-center text-xs text-muted mt-4">
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
    {error && <p className="text-terracotta text-sm text-center mb-3">{error}</p>}
    <button
      onClick={confirm}
      disabled={loading}
      className="btn btn-primary w-full"
    >
      {loading ? 'Confirmation...' : 'Confirmer ma sélection'}
    </button>
    </>
  );
}
