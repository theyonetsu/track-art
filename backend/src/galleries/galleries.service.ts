import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';

type Actor = { sub: string; role: string };

/** Champs modifiables par le photographe */
const EDITABLE = [
  'title', 'clientName', 'clientEmail', 'clientPhone', 'eventDate', 'message',
  'maxSelection', 'extraPhotoPrice', 'extensionPrice', 'extensionDays', 'allPhotosPrice', 'expiryDays',
  'allowHdDownload', 'coverPhotoId', 'isArchived', 'languages',
] as const;

@Injectable()
export class GalleriesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private jwt: JwtService,
    private settings: SettingsService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private ownerFilter(actor: Actor) {
    return actor.role === 'SUPERADMIN' ? {} : { userId: actor.sub };
  }

  private async findOwned(id: string, actor: Actor) {
    const g = await this.prisma.gallery.findFirst({ where: { id, ...this.ownerFilter(actor) } });
    if (!g) throw new NotFoundException('Galerie introuvable');
    return g;
  }

  /**
   * Tarifs effectifs : valeur de la galerie, sinon défaut du photographe, sinon plateforme.
   * Si la plateforme a retiré le droit correspondant, sa valeur s'impose quoi qu'il arrive.
   */
  async effectiveSettings(gallery: { userId: string | null; extraPhotoPrice: number | null; extensionPrice: number | null; extensionDays: number | null; allPhotosPrice?: number | null }) {
    const [user, platform] = await Promise.all([
      gallery.userId ? this.prisma.user.findUnique({ where: { id: gallery.userId } }) : null,
      this.settings.get(),
    ]);
    const pricing = platform.allowPricing;
    const expiry = platform.allowExpiry;
    return {
      extraPhotoPrice: pricing ? (gallery.extraPhotoPrice ?? user?.defaultExtraPhotoPrice ?? platform.extraPhotoPrice) : platform.extraPhotoPrice,
      extensionPrice: pricing ? (gallery.extensionPrice ?? user?.defaultExtensionPrice ?? platform.extensionPrice) : platform.extensionPrice,
      extensionDays: expiry ? (gallery.extensionDays ?? user?.defaultExtensionDays ?? platform.extensionDays) : platform.extensionDays,
      allPhotosPrice: !platform.allowAllPhotos
        ? platform.allPhotosPrice
        : pricing
          ? (gallery.allPhotosPrice ?? user?.defaultAllPhotosPrice ?? platform.allPhotosPrice)
          : platform.allPhotosPrice,
      commissionRate: platform.commissionRate,
      studioName: user?.studioName ?? user?.name ?? null,
      watermarkText: user?.watermarkText ?? user?.studioName ?? 'TRACK.ART',
    };
  }

  private async sanitize(body: Record<string, unknown>) {
    const policy = await this.settings.policy();
    const data: Record<string, unknown> = {};
    for (const f of EDITABLE) {
      if (!(f in body)) continue;
      let v = body[f];
      if (v === '') v = null;
      if (['maxSelection', 'extraPhotoPrice', 'extensionPrice', 'extensionDays', 'allPhotosPrice', 'expiryDays'].includes(f) && v !== null) {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0 || n > 100000) throw new BadRequestException(`Valeur invalide pour ${f}`);
        v = n;
      }
      if (f === 'eventDate' && v) v = new Date(v as string);
      data[f] = v;
    }

    // Bornes et droits fixés par la plateforme
    if (typeof data.extraPhotoPrice === 'number') this.settings.assertPrice(policy, 'Prix photo supplémentaire', data.extraPhotoPrice);
    if (typeof data.extensionPrice === 'number') this.settings.assertPrice(policy, 'Prix de prolongation', data.extensionPrice);
    if (typeof data.allPhotosPrice === 'number') {
      if (!policy.rights.allowAllPhotos) throw new ForbiddenException("L'achat groupé est géré par la plateforme.");
      this.settings.assertPrice(policy, 'Prix « toutes les photos »', data.allPhotosPrice);
    }
    if (typeof data.extensionDays === 'number') this.settings.assertDays(policy, 'Durée de prolongation', data.extensionDays, false);
    if (typeof data.expiryDays === 'number') this.settings.assertDays(policy, 'Durée de validité', data.expiryDays, true);

    if ('maxSelection' in data && (data.maxSelection as number) < 1) throw new BadRequestException('Au moins 1 photo incluse');
    if (data.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.clientEmail))) throw new BadRequestException('Email client invalide');
    return data;
  }

  // ─── Photographe ────────────────────────────────────────────────────────────

  async create(actor: Actor, body: Record<string, unknown>) {
    const user = await this.prisma.user.findUnique({ where: { id: actor.sub } });
    if (!user) throw new UnauthorizedException();
    const data = await this.sanitize(body);
    const policy = await this.settings.policy();
    if (!data.title || !String(data.title).trim()) throw new BadRequestException('Le titre est obligatoire');
    const gallery = await this.prisma.gallery.create({
      data: {
        ...(data as any),
        userId: user.id,
        maxSelection: (data.maxSelection as number) ?? user.defaultIncluded,
        expiryDays: policy.rights.allowExpiry ? ((data.expiryDays as number) ?? user.defaultExpiryDays) : policy.defaults.expiryDays,
      },
    });
    if (body.password) await this.setPassword(gallery.id, actor, String(body.password));
    if (gallery.clientEmail && body.sendEmail !== false) {
      await this.email.sendGalleryLink(gallery.clientEmail, gallery.title, this.url(gallery.slug), user.studioName ?? user.name ?? undefined);
    }
    return gallery;
  }

  findAll(actor: Actor) {
    return this.prisma.gallery.findMany({
      where: this.ownerFilter(actor),
      include: { photos: { select: { id: true, unlocked: true, paid: true } }, _count: { select: { payments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, actor: Actor) {
    const g = await this.prisma.gallery.findFirst({
      where: { id, ...this.ownerFilter(actor) },
      include: { photos: true, extensions: true, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!g) throw new NotFoundException('Galerie introuvable');
    const settings = await this.effectiveSettings(g);
    const { password, ...rest } = g;
    return { ...rest, hasPassword: !!password, effective: settings, url: this.url(g.slug) };
  }

  async update(id: string, actor: Actor, body: Record<string, unknown>) {
    await this.findOwned(id, actor);
    const data = await this.sanitize(body);
    const g = await this.prisma.gallery.update({ where: { id }, data: data as any });
    if ('password' in body) await this.setPassword(id, actor, body.password ? String(body.password) : null);
    return this.findById(id, actor);
  }

  async setPassword(id: string, actor: Actor, password: string | null) {
    await this.findOwned(id, actor);
    if (password && password.length < 4) throw new BadRequestException('Mot de passe : 4 caractères minimum');
    await this.prisma.gallery.update({ where: { id }, data: { password: password ? await bcrypt.hash(password, 10) : null } });
    return { hasPassword: !!password };
  }

  async sendLink(id: string, actor: Actor) {
    const g = await this.findOwned(id, actor);
    if (!g.clientEmail) throw new BadRequestException('Aucun email client configuré sur cette galerie');
    const user = await this.prisma.user.findUnique({ where: { id: actor.sub } });
    await this.email.sendGalleryLink(g.clientEmail, g.title, this.url(g.slug), user?.studioName ?? user?.name ?? undefined);
    return { sent: true };
  }

  /** Réinitialise l'expiration (nouvelle fenêtre de N jours à la prochaine ouverture) */
  async resetExpiry(id: string, actor: Actor) {
    await this.findOwned(id, actor);
    return this.prisma.gallery.update({ where: { id }, data: { firstOpenedAt: null, expiresAt: null } });
  }

  /** Prolonge manuellement (offert par le photographe) */
  async extend(id: string, actor: Actor, days: number) {
    const g = await this.findOwned(id, actor);
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 365) throw new BadRequestException('Durée invalide');
    const base = g.expiresAt && g.expiresAt > new Date() ? g.expiresAt : new Date();
    const expiresAt = new Date(base.getTime() + n * 86400000);
    await this.prisma.extension.create({ data: { galleryId: id, days: n, amount: 0 } });
    return this.prisma.gallery.update({ where: { id }, data: { expiresAt } });
  }

  async delete(id: string, actor: Actor) {
    await this.findOwned(id, actor);
    return this.prisma.gallery.delete({ where: { id } });
  }

  // ─── Client (public) ────────────────────────────────────────────────────────

  url(slug: string) {
    return `${process.env.APP_URL ?? 'http://localhost:3000'}/g/${slug}`;
  }

  /** Jeton d'accès à une galerie protégée (14 jours) */
  private accessToken(galleryId: string) {
    return this.jwt.sign({ gal: galleryId, kind: 'gallery-access' }, { expiresIn: '14d' });
  }

  private tokenAllows(galleryId: string, token?: string) {
    if (!token) return false;
    try {
      const p = this.jwt.verify(token) as { gal?: string; kind?: string };
      return p.kind === 'gallery-access' && p.gal === galleryId;
    } catch {
      return false;
    }
  }

  /** Vérifie qu'un appel public a le droit de voir la galerie (mot de passe éventuel). */
  async assertPublicAccess(galleryId: string, token?: string) {
    const g = await this.prisma.gallery.findUnique({ where: { id: galleryId } });
    if (!g || g.isArchived) throw new NotFoundException('Galerie introuvable');
    if (g.expiresAt && g.expiresAt < new Date()) throw new ForbiddenException('Galerie expirée');
    if (g.password && !this.tokenAllows(g.id, token)) throw new UnauthorizedException('Mot de passe requis');
    return g;
  }

  /** Vue publique. Si protégée et sans jeton valide → { locked: true }. */
  async findBySlug(slug: string, token?: string) {
    const g = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!g || g.isArchived) throw new NotFoundException('Galerie introuvable');
    if (g.expiresAt && g.expiresAt < new Date()) throw new ForbiddenException('Galerie expirée');

    const settings = await this.effectiveSettings(g);
    if (g.password && !this.tokenAllows(g.id, token)) {
      return { locked: true, id: g.id, slug: g.slug, title: g.title, studioName: settings.studioName };
    }

    if (!g.firstOpenedAt) {
      const now = new Date();
      const expires = new Date(now.getTime() + g.expiryDays * 86400000);
      await this.prisma.gallery.update({ where: { slug }, data: { firstOpenedAt: now, expiresAt: expires } });
      g.firstOpenedAt = now;
      g.expiresAt = expires;
    }

    const quota = await this.getQuota(g.id, g.maxSelection);
    const lockedCount = await this.prisma.photo.count({ where: { galleryId: g.id, unlocked: false } });
    const { password, clientEmail, clientPhone, userId, ...publicGallery } = g;
    return {
      ...publicGallery,
      ...quota,
      lockedCount,
      allPhotosPrice: settings.allPhotosPrice,
      locked: false,
      hasPassword: !!password,
      studioName: settings.studioName,
      extraPhotoPrice: settings.extraPhotoPrice,
      extensionPrice: settings.extensionPrice,
      extensionDays: settings.extensionDays,
    };
  }

  /** Le client saisit le mot de passe → jeton d'accès */
  async access(slug: string, password: string) {
    const g = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!g || g.isArchived) throw new NotFoundException('Galerie introuvable');
    if (!g.password) return { token: this.accessToken(g.id) };
    const ok = await bcrypt.compare(password ?? '', g.password);
    if (!ok) throw new UnauthorizedException('Mot de passe incorrect');
    return { token: this.accessToken(g.id) };
  }

  async getQuota(galleryId: string, maxSelection: number) {
    const includedUsed = await this.prisma.photo.count({ where: { galleryId, unlocked: true, paid: false } });
    return { includedUsed, includedRemaining: Math.max(0, maxSelection - includedUsed) };
  }

  /** Confirmation gratuite des photos incluses dans le forfait */
  async confirmSelection(slug: string, photoIds: string[], token?: string) {
    if (!Array.isArray(photoIds) || !photoIds.length) throw new BadRequestException('Aucune photo sélectionnée');
    const g0 = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!g0) throw new NotFoundException('Galerie introuvable');
    const g = await this.assertPublicAccess(g0.id, token);

    const photos = await this.prisma.photo.findMany({ where: { id: { in: photoIds }, galleryId: g.id, unlocked: false }, select: { id: true } });
    if (!photos.length) throw new BadRequestException('Aucune photo valide à confirmer');

    const { includedRemaining } = await this.getQuota(g.id, g.maxSelection);
    if (photos.length > includedRemaining) {
      throw new BadRequestException(`Votre forfait ne permet plus que ${includedRemaining} photo(s) incluse(s). Les photos supplémentaires sont payantes.`);
    }
    await this.prisma.photo.updateMany({ where: { id: { in: photos.map((p) => p.id) } }, data: { unlocked: true, paid: false } });
    return { success: true, photoIds: photos.map((p) => p.id) };
  }
}
