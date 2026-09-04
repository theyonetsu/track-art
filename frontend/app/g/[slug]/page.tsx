import { notFound } from 'next/navigation';
import GalleryClient from './GalleryClient';

const API = process.env.API_URL ?? 'http://localhost:3001';

async function getGallery(slug: string) {
  const res = await fetch(`${API}/galleries/${slug}`, { cache: 'no-store' });
  if (res.status === 403) return { expired: true } as const;
  if (!res.ok) return null;
  return res.json();
}

async function getPhotos(galleryId: string) {
  const res = await fetch(`${API}/photos/gallery/${galleryId}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) notFound();

  if ('expired' in gallery) {
    return (
      <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6">
        <div className="text-center flex flex-col items-center gap-5 max-w-md">
          <p className="font-serif text-sm tracking-[0.32em] uppercase">Track<span className="text-terracotta">.</span>Art</p>
          <p className="label text-terracotta">Galerie expirée</p>
          <h1 className="font-serif text-5xl">Cette galerie n&apos;est plus disponible.</h1>
          <p className="text-ink-soft">Contactez votre photographe pour obtenir une prolongation.</p>
        </div>
      </main>
    );
  }

  const photos = await getPhotos(gallery.id);
  const paypalClientId = process.env.PAYPAL_CLIENT_ID ?? '';

  return (
    <GalleryClient
      gallery={gallery}
      initialPhotos={photos}
      paypalClientId={paypalClientId}
    />
  );
}
