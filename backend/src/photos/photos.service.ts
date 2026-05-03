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

  async findByGallery(galleryId: string) {
    return this.prisma.photo.findMany({ where: { galleryId }, orderBy: { createdAt: 'asc' } });
  }

  async unlock(id: string) {
    return this.prisma.photo.update({ where: { id }, data: { unlocked: true } });
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

  async create(data: any) {
    return this.prisma.photo.create({ data });
  }
}
