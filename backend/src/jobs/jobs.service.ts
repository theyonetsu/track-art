import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  @Cron('0 3 * * *')
  async purgeExpiredGalleries() {
    const expired = await this.prisma.gallery.findMany({
      where: { expiresAt: { lt: new Date() } },
      include: { photos: true },
    });
    for (const g of expired) {
      for (const p of g.photos) {
        await this.storage.delete(p.originalKey);
        await this.storage.delete(p.previewKey);
        await this.storage.delete(p.watermarkKey);
      }
      await this.prisma.gallery.delete({ where: { id: g.id } });
    }
    console.log(`Purge: ${expired.length} galeries supprimees`);
  }
}
