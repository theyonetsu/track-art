import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const GALLERY_LIFETIME_DAYS = 30;

@Injectable()
export class GalleriesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async create(data: any) {
    const gallery = await this.prisma.gallery.create({ data });
    if (gallery.clientEmail) {
      const url = `${process.env.APP_URL}/g/${gallery.slug}`;
      await this.email.sendGalleryLink(gallery.clientEmail, gallery.title, url);
    }
    return gallery;
  }

  async findAll() {
    return this.prisma.gallery.findMany({
      include: { photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const g = await this.prisma.gallery.findUnique({
      where: { id },
      include: { photos: true, extensions: true },
    });
    if (!g) throw new NotFoundException('Galerie introuvable');
    return g;
  }

  async update(id: string, data: Partial<{
    title: string;
    maxSelection: number;
    clientEmail: string;
    clientPhone: string;
    languages: string[];
  }>) {
    const g = await this.prisma.gallery.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    return this.prisma.gallery.update({ where: { id }, data });
  }

  async sendLink(id: string) {
    const g = await this.prisma.gallery.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    if (!g.clientEmail) throw new BadRequestException('Aucun email client configuré sur cette galerie');
    const url = `${process.env.APP_URL}/g/${g.slug}`;
    await this.email.sendGalleryLink(g.clientEmail, g.title, url);
    return { sent: true };
  }

  /**
   * Quota du forfait : nombre de photos incluses déjà consommées
   * (déverrouillées sans paiement) et nombre restant.
   */
  async getQuota(galleryId: string, maxSelection: number) {
    const includedUsed = await this.prisma.photo.count({
      where: { galleryId, unlocked: true, paid: false },
    });
    return { includedUsed, includedRemaining: Math.max(0, maxSelection - includedUsed) };
  }

  /** Vue publique (client). Ne renvoie jamais les clés de stockage. */
  async findBySlug(slug: string) {
    const g = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    if (g.expiresAt && g.expiresAt < new Date()) throw new ForbiddenException('Galerie expirée');

    if (!g.firstOpenedAt) {
      const now = new Date();
      const expires = new Date(now.getTime() + GALLERY_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
      await this.prisma.gallery.update({ where: { slug }, data: { firstOpenedAt: now, expiresAt: expires } });
      g.firstOpenedAt = now;
      g.expiresAt = expires;
    }

    const quota = await this.getQuota(g.id, g.maxSelection);
    const { clientEmail, clientPhone, ...publicGallery } = g;
    return { ...publicGallery, ...quota };
  }

  /**
   * Confirmation gratuite : le client valide des photos comprises dans son forfait.
   * Refuse si la sélection dépasse le quota restant (les extras passent par PayPal).
   */
  async confirmSelection(slug: string, photoIds: string[]) {
    if (!Array.isArray(photoIds) || !photoIds.length) throw new BadRequestException('Aucune photo sélectionnée');
    const g = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    if (g.expiresAt && g.expiresAt < new Date()) throw new ForbiddenException('Galerie expirée');

    const photos = await this.prisma.photo.findMany({
      where: { id: { in: photoIds }, galleryId: g.id, unlocked: false },
      select: { id: true },
    });
    if (!photos.length) throw new BadRequestException('Aucune photo valide à confirmer');

    const { includedRemaining } = await this.getQuota(g.id, g.maxSelection);
    if (photos.length > includedRemaining) {
      throw new BadRequestException(
        `Votre forfait ne permet plus que ${includedRemaining} photo(s) incluse(s). Les photos supplémentaires sont payantes.`,
      );
    }

    await this.prisma.photo.updateMany({
      where: { id: { in: photos.map((p) => p.id) } },
      data: { unlocked: true, paid: false },
    });

    return { success: true, photoIds: photos.map((p) => p.id) };
  }

  async delete(id: string) {
    return this.prisma.gallery.delete({ where: { id } });
  }
}
