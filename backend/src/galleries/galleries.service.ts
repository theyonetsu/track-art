import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

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

  async findBySlug(slug: string) {
    const g = await this.prisma.gallery.findUnique({ where: { slug }, include: { photos: true } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    if (g.expiresAt && g.expiresAt < new Date()) throw new ForbiddenException('Galerie expirée');
    if (!g.firstOpenedAt) {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.gallery.update({ where: { slug }, data: { firstOpenedAt: now, expiresAt: expires } });
      g.firstOpenedAt = now;
      g.expiresAt = expires;
    }
    return g;
  }

  async delete(id: string) {
    return this.prisma.gallery.delete({ where: { id } });
  }
}
