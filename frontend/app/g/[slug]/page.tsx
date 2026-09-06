import Link from 'next/link';
import GalleryGate from './GalleryGate';

const API = process.env.API_URL ?? 'http://localhost:3001';

async function getGallery(slug: string) {
  try {
    const res = await fetch(`${API}/galleries/${slug}`, { cache: 'no-store' });
    if (res.status === 403) return { status: 'expired' as const };
    if (res.status === 404) return { status: 'notfound' as const };
    if (!res.ok) return { status: 'error' as const };
    return { status: 'ok' as const, gallery: await res.json() };
  } catch {
    return { status: 'error' as const };
  }
}

async function getPhotos(galleryId: string) {
  try {
    const res = await fetch(`${API}/photos/gallery/${galleryId}`, { cache: 'no-store' });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

/** Onglet du navigateur et aperçu du lien quand le photographe l'envoie par SMS ou messagerie. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getGallery(slug);
  const noIndex = { robots: { index: false, follow: false } }; // une galerie privée ne doit jamais être indexée
  if (result.status !== 'ok') return { title: 'Galerie — Track.Art', ...noIndex };
  const g = result.gallery;
  const title = g.locked ? `Galerie protégée — Track.Art` : `${g.title} — Track.Art`;
  const description = g.studioName ? `Votre galerie privée par ${g.studioName}.` : 'Votre galerie privée de photos.';
  return { title, description, openGraph: { title, description, type: 'website' }, ...noIndex };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getGallery(slug);

  if (result.status !== 'ok') {
    const copy = {
      expired: { eyebrow: 'Galerie expirée', title: 'Cette galerie n’est plus disponible.', text: 'Contactez votre photographe pour obtenir une prolongation.' },
      notfound: { eyebrow: 'Galerie introuvable', title: 'Ce lien ne mène nulle part.', text: 'Vérifiez l’adresse reçue ou demandez un nouveau lien à votre photographe.' },
      error: { eyebrow: 'Indisponible', title: 'Un instant…', text: 'La galerie ne répond pas pour le moment. Réessayez dans quelques minutes.' },
    }[result.status];
    return (
      <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6">
        <div className="text-center flex flex-col items-center gap-5 max-w-md fade-up">
          <Link href="/" className="font-serif text-sm tracking-[0.32em] uppercase hover:text-terracotta transition-colors">Track<span className="text-terracotta">.</span>Art</Link>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-serif text-5xl">{copy.title}</h1>
          <p className="text-ink-soft">{copy.text}</p>
          <Link href="/" className="btn btn-outline mt-2">Découvrir Track.Art</Link>
        </div>
      </main>
    );
  }

  const gallery = result.gallery;
  const photos = gallery.locked ? [] : await getPhotos(gallery.id);
  return <GalleryGate slug={slug} initialGallery={gallery} initialPhotos={photos} paypalClientId={process.env.PAYPAL_CLIENT_ID ?? ''} />;
}
