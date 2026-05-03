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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4 px-8">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500">Galerie expirée</p>
          <h1 className="text-3xl font-thin tracking-widest">Cette galerie n&apos;est plus disponible</h1>
          <p className="text-gray-600 text-sm">Contactez votre photographe pour obtenir une extension.</p>
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
