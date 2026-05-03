import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../image-processing/image-processing.service';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private imageProcessing: ImageProcessingService,
  ) {}

  async uploadToGallery(galleryId: string, files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      const photoId = randomUUID();
      const base = `galleries/${galleryId}/${photoId}`;

      const [preview, watermark] = await Promise.all([
        this.imageProcessing.generatePreview(file.buffer),
        this.imageProcessing.generateWatermark(file.buffer),
      ]);

      await Promise.all([
        this.storage.upload(`${base}-original`, file.buffer, file.mimetype),
        this.storage.upload(`${base}-preview`, preview, 'image/jpeg'),
        this.storage.upload(`${base}-watermark`, watermark, 'image/jpeg'),
      ]);

      const photo = await this.prisma.photo.create({
        data: {
          id: photoId,
          galleryId,
          originalKey: `${base}-original`,
          previewKey: `${base}-preview`,
          watermarkKey: `${base}-watermark`,
        },
      });
      results.push(photo);
    }
    return results;
  }

  /** Public endpoint — watermark only; original URL if unlocked. */
  async findByGallery(galleryId: string) {
    const photos = await this.prisma.photo.findMany({
      where: { galleryId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      photos.map(async (photo) => {
        const watermarkUrl = await this.storage.getSignedUrl(photo.watermarkKey);
        const originalUrl = photo.unlocked
          ? await this.storage.getSignedUrl(photo.originalKey)
          : null;
        return {
          id: photo.id,
          galleryId: photo.galleryId,
          unlocked: photo.unlocked,
          price: photo.price,
          createdAt: photo.createdAt,
          watermarkUrl,
          originalUrl,
        };
      }),
    );
  }

  /** Admin endpoint — all three URLs so the dashboard can display full previews. */
  async findByGalleryAdmin(galleryId: string) {
    const photos = await this.prisma.photo.findMany({
      where: { galleryId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      photos.map(async (photo) => {
        const [previewUrl, watermarkUrl, originalUrl] = await Promise.all([
          this.storage.getSignedUrl(photo.previewKey),
          this.storage.getSignedUrl(photo.watermarkKey),
          this.storage.getSignedUrl(photo.originalKey),
        ]);
        return {
          id: photo.id,
          galleryId: photo.galleryId,
          unlocked: photo.unlocked,
          price: photo.price,
          createdAt: photo.createdAt,
          previewUrl,
          watermarkUrl,
          originalUrl,
        };
      }),
    );
  }

  async unlock(id: string) {
    return this.prisma.photo.update({ where: { id }, data: { unlocked: true } });
  }

  async updatePrice(id: string, price: number) {
    return this.prisma.photo.update({ where: { id }, data: { price } });
  }

  async deleteWithStorage(id: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Photo introuvable');
    await Promise.all([
      this.storage.delete(photo.originalKey),
      this.storage.delete(photo.previewKey),
      this.storage.delete(photo.watermarkKey),
    ]);
    return this.prisma.photo.delete({ where: { id } });
  }
}
