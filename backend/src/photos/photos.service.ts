import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { GalleriesService } from '../galleries/galleries.service';

type Actor = { sub: string; role: string };

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private imageProcessing: ImageProcessingService,
    private galleries: GalleriesService,
  ) {}

  private async ownedGallery(galleryId: string, actor: Actor) {
    const g = await this.prisma.gallery.findFirst({ where: { id: galleryId, ...(actor.role === 'SUPERADMIN' ? {} : { userId: actor.sub }) } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    return g;
  }

  private async ownedPhoto(id: string, actor: Actor) {
    const p = await this.prisma.photo.findUnique({ where: { id }, include: { gallery: true } });
    if (!p || (actor.role !== 'SUPERADMIN' && p.gallery.userId !== actor.sub)) throw new NotFoundException('Photo introuvable');
    return p;
  }

  async uploadToGallery(galleryId: string, actor: Actor, files: Express.Multer.File[]) {
    const gallery = await this.ownedGallery(galleryId, actor);
    const settings = await this.galleries.effectiveSettings(gallery);
    const last = await this.prisma.photo.findFirst({ where: { galleryId }, orderBy: { sortOrder: 'desc' } });
    let order = (last?.sortOrder ?? 0) + 1;

    const results = [];
    for (const file of files) {
      const photoId = randomUUID();
      const base = `galleries/${galleryId}/${photoId}`;
      const [preview, watermark, meta] = await Promise.all([
        this.imageProcessing.generatePreview(file.buffer),
        this.imageProcessing.generateWatermark(file.buffer, settings.watermarkText),
        this.imageProcessing.metadata(file.buffer),
      ]);
      await Promise.all([
        this.storage.upload(`${base}-original`, file.buffer, file.mimetype),
        this.storage.upload(`${base}-preview`, preview, 'image/jpeg'),
        this.storage.upload(`${base}-watermark`, watermark, 'image/jpeg'),
      ]);
      const photo = await this.prisma.photo.create({
        data: {
          id: photoId, galleryId,
          originalKey: `${base}-original`, previewKey: `${base}-preview`, watermarkKey: `${base}-watermark`,
          filename: file.originalname?.slice(0, 200) ?? null,
          width: meta.width ?? null, height: meta.height ?? null,
          price: settings.extraPhotoPrice,
          sortOrder: order++,
        },
      });
      results.push(photo);
    }
    if (!gallery.coverPhotoId && results.length) {
      await this.prisma.gallery.update({ where: { id: galleryId }, data: { coverPhotoId: results[0].id } });
    }
    return results;
  }

  /** Public — watermark uniquement ; original si déverrouillée ET téléchargement HD autorisé. */
  async findByGallery(galleryId: string, token?: string) {
    const gallery = await this.galleries.assertPublicAccess(galleryId, token);
    const photos = await this.prisma.photo.findMany({ where: { galleryId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    return Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        galleryId: photo.galleryId,
        unlocked: photo.unlocked,
        price: photo.price,
        width: photo.width,
        height: photo.height,
        createdAt: photo.createdAt,
        watermarkUrl: await this.storage.getSignedUrl(photo.watermarkKey),
        originalUrl: photo.unlocked && gallery.allowHdDownload ? await this.storage.getSignedUrl(photo.originalKey) : null,
        isCover: gallery.coverPhotoId === photo.id,
      })),
    );
  }

  /** Photographe — toutes les URLs. */
  async findByGalleryAdmin(galleryId: string, actor: Actor) {
    const gallery = await this.ownedGallery(galleryId, actor);
    const photos = await this.prisma.photo.findMany({ where: { galleryId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    return Promise.all(
      photos.map(async (photo) => {
        const [previewUrl, watermarkUrl, originalUrl] = await Promise.all([
          this.storage.getSignedUrl(photo.previewKey),
          this.storage.getSignedUrl(photo.watermarkKey),
          this.storage.getSignedUrl(photo.originalKey),
        ]);
        return { ...photo, previewUrl, watermarkUrl, originalUrl, isCover: gallery.coverPhotoId === photo.id };
      }),
    );
  }

  async unlock(id: string, actor: Actor) {
    await this.ownedPhoto(id, actor);
    return this.prisma.photo.update({ where: { id }, data: { unlocked: true, paid: false } });
  }

  async lock(id: string, actor: Actor) {
    await this.ownedPhoto(id, actor);
    return this.prisma.photo.update({ where: { id }, data: { unlocked: false, paid: false } });
  }

  async updatePrice(id: string, actor: Actor, price: number) {
    await this.ownedPhoto(id, actor);
    const n = Number(price);
    if (!Number.isInteger(n) || n < 0 || n > 10000) throw new BadRequestException('Prix invalide');
    return this.prisma.photo.update({ where: { id }, data: { price: n } });
  }

  async reorder(galleryId: string, actor: Actor, ids: string[]) {
    await this.ownedGallery(galleryId, actor);
    await this.prisma.$transaction(ids.map((id, i) => this.prisma.photo.updateMany({ where: { id, galleryId }, data: { sortOrder: i } })));
    return { success: true };
  }

  async deleteWithStorage(id: string, actor: Actor) {
    const photo = await this.ownedPhoto(id, actor);
    await Promise.all([this.storage.delete(photo.originalKey), this.storage.delete(photo.previewKey), this.storage.delete(photo.watermarkKey)]);
    if (photo.gallery.coverPhotoId === id) await this.prisma.gallery.update({ where: { id: photo.galleryId }, data: { coverPhotoId: null } });
    return this.prisma.photo.delete({ where: { id } });
  }
}
