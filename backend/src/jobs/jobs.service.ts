import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private email: EmailService,
  ) {}

  /** 08:00 — warn clients whose gallery expires within 3 days. */
  @Cron('0 8 * * *')
  async sendExpiryWarnings() {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringSoon = await this.prisma.gallery.findMany({
      where: {
        clientEmail: { not: null },
        expiresAt: { gt: now, lte: in3Days },
      },
    });

    for (const g of expiringSoon) {
      const url = `${process.env.APP_URL}/g/${g.slug}`;
      await this.email.sendGalleryExpiryWarning(g.clientEmail!, g.title, g.expiresAt!, url);
    }

    if (expiringSoon.length) {
      this.logger.log(`Avertissements expiration envoyés : ${expiringSoon.length} galerie(s)`);
    }
  }

  /** 03:00 — delete galleries past their expiry date. */
  @Cron('0 3 * * *')
  async purgeExpiredGalleries() {
    const expired = await this.prisma.gallery.findMany({
      where: { expiresAt: { lt: new Date() } },
      include: { photos: true },
    });

    for (const g of expired) {
      await Promise.all(
        g.photos.flatMap((p) => [
          this.storage.delete(p.originalKey),
          this.storage.delete(p.previewKey),
          this.storage.delete(p.watermarkKey),
        ]),
      );
      await this.prisma.gallery.delete({ where: { id: g.id } });
    }

    if (expired.length) {
      this.logger.log(`Purge : ${expired.length} galerie(s) expirée(s) supprimée(s)`);
    }
  }
}
