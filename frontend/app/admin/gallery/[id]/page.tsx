'use client';

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gallery = {
  id: string;
  title: string;
  slug: string;
  maxSelection: number;
  clientEmail: string | null;
  clientPhone: string | null;
  expiresAt: string | null;
  firstOpenedAt: string | null;
  createdAt: string;
  photos: unknown[];
};

type AdminPhoto = {
  id: string;
  galleryId: string;
  unlocked: boolean;
  price: number;
  createdAt: string;
  previewUrl: string;
  watermarkUrl: string;
  originalUrl: string;
};

type Settings = {
  extensionPrice: number;
  extensionDays: number;
  extraPhotoPrice: number;
};

type PendingPreview = { localId: string; url: string; name: string };

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-xs tracking-widest uppercase px-5 py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Gallery form state
  const [title, setTitle] = useState('');
  const [maxSelection, setMaxSelection] = useState(30);
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [savingGallery, setSavingGallery] = useState(false);

  // Pricing form state
  const [extensionPrice, setExtensionPrice] = useState(5);
  const [extensionDays, setExtensionDays] = useState(7);
  const [extraPhotoPrice, setExtraPhotoPrice] = useState(2);
  const [savingPrices, setSavingPrices] = useState(false);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-photo price editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Link actions
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // ─── Auth + initial load ───────────────────────────────────────────────────

  useEffect(() => {
    const t = localStorage.getItem('token') ?? '';
    if (!t) { router.replace('/admin/login'); return; }
    setToken(t);
  }, [router]);

  const auth = useCallback(
    (extra?: Record<string, string>) => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...extra,
    }),
    [token],
  );

  const loadPhotos = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API}/photos/gallery/${id}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setPhotos(await res.json());
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const [gRes, pRes, sRes] = await Promise.all([
          fetch(`${API}/galleries/manage/${id}`, { headers: auth() }),
          fetch(`${API}/photos/gallery/${id}/admin`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/admin/settings`, { headers: auth() }),
        ]);

        if (gRes.status === 401) { router.replace('/admin/login'); return; }

        const [g, p, s]: [Gallery, AdminPhoto[], Settings] = await Promise.all([
          gRes.json(), pRes.json(), sRes.json(),
        ]);

        setGallery(g);
        setTitle(g.title);
        setMaxSelection(g.maxSelection);
        setClientEmail(g.clientEmail ?? '');
        setClientPhone(g.clientPhone ?? '');
        setPhotos(p);
        setSettings(s);
        setExtensionPrice(s.extensionPrice);
        setExtensionDays(s.extensionDays);
        setExtraPhotoPrice(s.extraPhotoPrice);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, auth, router]);

  // ─── Upload ────────────────────────────────────────────────────────────────

  function handleFiles(files: File[]) {
    if (!files.length || uploading) return;

    const previews: PendingPreview[] = files.map((f) => ({
      localId: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPendingPreviews(previews);

    const form = new FormData();
    files.forEach((f) => form.append('photos', f));

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(0);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPendingPreviews([]);
      loadPhotos();
      setToast(`${files.length} photo${files.length > 1 ? 's' : ''} ajoutée${files.length > 1 ? 's' : ''}`);
    };
    xhr.onerror = () => {
      setUploading(false);
      setPendingPreviews([]);
      setToast('Erreur lors de l\'upload');
    };

    xhr.open('POST', `${API}/photos/gallery/${id}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    setUploading(true);
    xhr.send(form);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    handleFiles(files);
  }
  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    e.target.value = '';
  }

  // ─── Gallery save ──────────────────────────────────────────────────────────

  async function saveGallery() {
    setSavingGallery(true);
    try {
      const res = await fetch(`${API}/galleries/manage/${id}`, {
        method: 'PATCH',
        headers: auth(),
        body: JSON.stringify({ title, maxSelection, clientEmail: clientEmail || null, clientPhone: clientPhone || null }),
      });
      if (res.ok) {
        const g = await res.json();
        setGallery(g);
        setToast('Galerie sauvegardée');
      }
    } finally {
      setSavingGallery(false);
    }
  }

  // ─── Price settings save ───────────────────────────────────────────────────

  async function savePrices() {
    setSavingPrices(true);
    try {
      await fetch(`${API}/admin/settings`, {
        method: 'PATCH',
        headers: auth(),
        body: JSON.stringify({ extensionPrice, extensionDays, extraPhotoPrice }),
      });
      setToast('Tarifs sauvegardés');
    } finally {
      setSavingPrices(false);
    }
  }

  // ─── Photo price edit ──────────────────────────────────────────────────────

  function startEditPrice(photo: AdminPhoto) {
    setEditingPriceId(photo.id);
    setEditingPriceVal(String(photo.price));
    setTimeout(() => priceInputRef.current?.select(), 0);
  }

  async function commitPrice(photoId: string) {
    const price = parseInt(editingPriceVal, 10);
    if (isNaN(price) || price < 0) { setEditingPriceId(null); return; }
    setEditingPriceId(null);
    await fetch(`${API}/photos/${photoId}/price`, {
      method: 'PATCH',
      headers: auth(),
      body: JSON.stringify({ price }),
    });
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, price } : p)));
  }

  // ─── Delete photo ──────────────────────────────────────────────────────────

  async function deletePhoto(photoId: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    await fetch(`${API}/photos/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ─── Client link ───────────────────────────────────────────────────────────

  const clientUrl = gallery ? `${window?.location?.origin?.replace('3000', '3000') ?? 'http://localhost:3000'}/g/${gallery.slug}` : '';

  function copyLink() {
    if (!gallery) return;
    navigator.clipboard.writeText(`${window.location.origin}/g/${gallery.slug}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function sendEmail() {
    if (!gallery?.clientEmail) return;
    setSendingEmail(true);
    try {
      await fetch(`${API}/galleries/manage/${id}/send-link`, {
        method: 'POST',
        headers: auth(),
      });
      setToast('Email envoyé à ' + gallery.clientEmail);
    } finally {
      setSendingEmail(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  const totalPhotos = photos.length + pendingPreviews.length;
  const daysLeft = gallery?.expiresAt
    ? Math.ceil((new Date(gallery.expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="text-gray-500 hover:text-white transition-colors text-xs tracking-widest uppercase flex items-center gap-2 shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Galeries
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-light tracking-[0.12em] truncate">{gallery?.title}</p>
            <p className="text-[10px] text-gray-600 tracking-widest">
              {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
              {daysLeft !== null && (
                <span className={daysLeft <= 3 ? ' text-red-500' : ''}> · {daysLeft}j restants</span>
              )}
            </p>
          </div>

          <button
            onClick={() => { localStorage.removeItem('token'); router.push('/admin/login'); }}
            className="text-gray-600 hover:text-white transition-colors text-xs tracking-widest uppercase shrink-0"
          >
            Déco.
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

        {/* ── Left: settings panel ── */}
        <aside className="space-y-6">

          {/* Gallery settings */}
          <Section title="Paramètres">
            <Field label="Titre">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Nom de la galerie"
              />
            </Field>
            <Field label="Photos incluses">
              <select
                value={maxSelection}
                onChange={(e) => setMaxSelection(Number(e.target.value))}
                className="input bg-black"
              >
                {[10, 15, 20, 25, 30, 40, 50, 60, 80, 100].map((n) => (
                  <option key={n} value={n}>{n} photos</option>
                ))}
              </select>
            </Field>
            <Field label="Email client">
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="input"
                placeholder="client@email.com"
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="input"
                placeholder="+33 6 00 00 00 00"
              />
            </Field>
            <SaveButton onClick={saveGallery} loading={savingGallery} />
          </Section>

          {/* Client link */}
          <Section title="Lien client">
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2 rounded">
              <span className="text-xs text-gray-500 truncate flex-1 font-mono">
                /g/{gallery?.slug}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={copyLink}
                className={`flex-1 py-2 border text-xs tracking-widest uppercase transition-all ${
                  linkCopied
                    ? 'border-white text-white bg-white/5'
                    : 'border-white/20 text-gray-400 hover:border-white hover:text-white'
                }`}
              >
                {linkCopied ? '✓ Copié' : 'Copier'}
              </button>
              <button
                onClick={sendEmail}
                disabled={!clientEmail || sendingEmail}
                title={!clientEmail ? 'Ajoutez un email client d\'abord' : 'Envoyer par email'}
                className="flex-1 py-2 border border-white/20 text-gray-400 text-xs tracking-widest uppercase hover:border-white hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Envoi...' : '✉ Email'}
              </button>
            </div>
            {!clientEmail && (
              <p className="text-[10px] text-gray-600 text-center">
                Ajoutez un email client pour envoyer le lien
              </p>
            )}
          </Section>

          {/* Pricing */}
          <Section title="Tarifs">
            <Field label="Prix / photo extra (€)">
              <input
                type="number"
                min={0}
                value={extraPhotoPrice}
                onChange={(e) => setExtraPhotoPrice(Number(e.target.value))}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Extension (€)">
                <input
                  type="number"
                  min={0}
                  value={extensionPrice}
                  onChange={(e) => setExtensionPrice(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Durée (j)">
                <input
                  type="number"
                  min={1}
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="input"
                />
              </Field>
            </div>
            <SaveButton onClick={savePrices} loading={savingPrices} />
          </Section>

          {/* Danger zone */}
          <Section title="Zone critique">
            <button
              onClick={async () => {
                if (!confirm(`Supprimer "${gallery?.title}" et toutes ses photos ?`)) return;
                await fetch(`${API}/galleries/${id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                });
                router.push('/admin/dashboard');
              }}
              className="w-full py-2.5 border border-red-900 text-red-700 hover:border-red-500 hover:text-red-400 text-xs tracking-widest uppercase transition-all"
            >
              Supprimer la galerie
            </button>
          </Section>
        </aside>

        {/* ── Right: photo section ── */}
        <main className="space-y-5">

          {/* Upload zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded transition-all duration-200 cursor-pointer
              ${isDragging
                ? 'border-white bg-white/5 scale-[1.005]'
                : 'border-white/15 hover:border-white/35'
              }
              ${uploading ? 'cursor-default' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/tiff"
              multiple
              className="hidden"
              onChange={onFileInput}
            />

            <div className="py-10 flex flex-col items-center gap-3 select-none">
              {uploading ? (
                <>
                  <UploadIcon className="w-8 h-8 text-white animate-bounce" />
                  <p className="text-xs tracking-widest uppercase text-gray-400">
                    Upload en cours...
                  </p>
                  <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{uploadProgress}%</p>
                </>
              ) : (
                <>
                  <UploadIcon
                    className={`w-8 h-8 transition-colors ${isDragging ? 'text-white' : 'text-gray-600'}`}
                  />
                  <p className={`text-sm font-light transition-colors ${isDragging ? 'text-white' : 'text-gray-500'}`}>
                    {isDragging ? 'Déposez vos photos' : 'Glissez-déposez vos photos ici'}
                  </p>
                  <p className="text-xs text-gray-700 tracking-wider">
                    ou cliquez pour parcourir · JPEG, PNG, WEBP, HEIC · 50 Mo max
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Stats bar */}
          {(photos.length > 0 || pendingPreviews.length > 0) && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                <span className="text-white">{totalPhotos}</span> photo{totalPhotos !== 1 ? 's' : ''}
                {gallery && (
                  <span> · {photos.filter((p) => p.unlocked).length} déverrouillée{photos.filter((p) => p.unlocked).length !== 1 ? 's' : ''}</span>
                )}
              </span>
              <span className="tracking-widest uppercase">
                Sélection max : {maxSelection}
              </span>
            </div>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">

            {/* Pending previews (uploading) */}
            {pendingPreviews.map((p) => (
              <div key={p.localId} className="relative aspect-square overflow-hidden bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              </div>
            ))}

            {/* Uploaded photos */}
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isEditingPrice={editingPriceId === photo.id}
                editingPriceVal={editingPriceVal}
                priceInputRef={editingPriceId === photo.id ? priceInputRef : undefined}
                onEditPrice={() => startEditPrice(photo)}
                onPriceChange={(v) => setEditingPriceVal(v)}
                onPriceCommit={() => commitPrice(photo.id)}
                onPriceKeyDown={(e) => {
                  if (e.key === 'Enter') commitPrice(photo.id);
                  if (e.key === 'Escape') setEditingPriceId(null);
                }}
                onDelete={() => deletePhoto(photo.id)}
              />
            ))}
          </div>

          {/* Empty state */}
          {photos.length === 0 && pendingPreviews.length === 0 && !uploading && (
            <div className="py-20 text-center text-gray-700 text-xs tracking-widest uppercase">
              Aucune photo — glissez-déposez pour commencer
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}

// ─── PhotoCard ─────────────────────────────────────────────────────────────────

type PhotoCardProps = {
  photo: AdminPhoto;
  isEditingPrice: boolean;
  editingPriceVal: string;
  priceInputRef?: React.RefObject<HTMLInputElement | null>;
  onEditPrice: () => void;
  onPriceChange: (v: string) => void;
  onPriceCommit: () => void;
  onPriceKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDelete: () => void;
};

function PhotoCard({
  photo,
  isEditingPrice,
  editingPriceVal,
  priceInputRef,
  onEditPrice,
  onPriceChange,
  onPriceCommit,
  onPriceKeyDown,
  onDelete,
}: PhotoCardProps) {
  return (
    <div className="relative aspect-square overflow-hidden group bg-white/5">
      {/* Preview image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt=""
        className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
        loading="lazy"
      />

      {/* Delete button */}
      <button
        onClick={onDelete}
        aria-label="Supprimer"
        className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white/60 hover:text-white hover:bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Status badge */}
      {photo.unlocked && (
        <div className="absolute top-2 left-2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 tracking-wider">
          DÉVERROUILLÉE
        </div>
      )}

      {/* Bottom bar: price */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditingPrice ? (
          <div className="flex items-center gap-1">
            <input
              ref={priceInputRef as React.RefObject<HTMLInputElement>}
              type="number"
              min={0}
              value={editingPriceVal}
              onChange={(e) => onPriceChange(e.target.value)}
              onBlur={onPriceCommit}
              onKeyDown={onPriceKeyDown}
              className="w-14 bg-white text-black text-xs px-1.5 py-0.5 outline-none text-center"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-white/60 text-xs">€</span>
          </div>
        ) : (
          <button
            onClick={onEditPrice}
            className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{photo.price}€</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI pieces ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/8 p-4 space-y-3">
      <h2 className="text-[10px] tracking-[0.25em] uppercase text-gray-500 pb-1 border-b border-white/5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] tracking-widest uppercase text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 border border-white/20 text-gray-300 text-xs tracking-widest uppercase hover:border-white hover:text-white transition-all disabled:opacity-50 mt-1"
    >
      {loading ? 'Sauvegarde...' : 'Enregistrer'}
    </button>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black border-b border-white/5 h-14" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        <div className="space-y-4">
          {[80, 60, 100, 40].map((w, i) => (
            <div key={i} className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
