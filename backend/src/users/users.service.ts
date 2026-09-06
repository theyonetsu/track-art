import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SettingsService } from '../settings/settings.service';

const PROFILE_FIELDS = ['name', 'studioName', 'phone', 'website', 'watermarkText'] as const;
const DEFAULT_FIELDS = ['defaultIncluded', 'defaultExtraPhotoPrice', 'defaultExtensionPrice', 'defaultExtensionDays', 'defaultExpiryDays'] as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  async createAdmin(email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    return this.prisma.user.create({ data: { email, password: hash, role: 'SUPERADMIN' } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Profil public (sans secrets) */
  async me(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException();
    const { password, totpSecret, ...safe } = u;
    const [galleries, payments] = await Promise.all([
      this.prisma.gallery.count({ where: { userId } }),
      this.prisma.payment.aggregate({ where: { userId, status: 'completed' }, _sum: { amount: true, netAmount: true, platformFee: true }, _count: true }),
    ]);
    return {
      ...safe,
      stats: {
        galleries,
        sales: payments._count,
        gross: payments._sum.amount ?? 0,
        net: payments._sum.netAmount ?? 0,
        fees: payments._sum.platformFee ?? 0,
      },
    };
  }

  async updateMe(userId: string, body: Record<string, unknown>) {
    const policy = await this.settings.policy();
    const data: Record<string, unknown> = {};
    for (const f of PROFILE_FIELDS) if (f in body) data[f] = body[f] === '' ? null : body[f];

    if ('defaultAllPhotosPrice' in body) {
      const v = body.defaultAllPhotosPrice;
      if (v === null || v === '' || v === undefined) data.defaultAllPhotosPrice = null;
      else {
        const n = Number(v);
        if (!Number.isInteger(n)) throw new BadRequestException('Prix « toutes les photos » invalide');
        if (!policy.rights.allowAllPhotos) throw new ForbiddenException("L'achat groupé est géré par la plateforme.");
        this.settings.assertPrice(policy, 'Prix « toutes les photos »', n);
        data.defaultAllPhotosPrice = n;
      }
    }

    for (const f of DEFAULT_FIELDS) {
      if (!(f in body)) continue;
      const n = Number(body[f]);
      if (!Number.isInteger(n) || n < 0 || n > 10000) throw new BadRequestException(`Valeur invalide pour ${f}`);
      if (f === 'defaultExtraPhotoPrice') this.settings.assertPrice(policy, 'Prix photo supplémentaire', n);
      if (f === 'defaultExtensionPrice') this.settings.assertPrice(policy, 'Prix de prolongation', n);
      if (f === 'defaultExtensionDays') this.settings.assertDays(policy, 'Durée de prolongation', n, false);
      if (f === 'defaultExpiryDays') this.settings.assertDays(policy, 'Durée de validité', n, true);
      // defaultIncluded = 0 : aucune photo incluse, tout est vendu à l'unité
      data[f] = n;
    }

    await this.prisma.user.update({ where: { id: userId }, data });
    return this.me(userId);
  }


  /**
   * Tableau de bord plateforme (super-admin) : agrégats globaux, séries des
   * 30 derniers jours et fiche détaillée par photographe.
   */
  async platformStats() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);

    const [users, galleries, photos, payments] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, studioName: true, role: true, createdAt: true },
      }),
      this.prisma.gallery.findMany({
        select: { id: true, userId: true, createdAt: true, isArchived: true, expiresAt: true, firstOpenedAt: true, _count: { select: { photos: true } } },
      }),
      this.prisma.photo.count(),
      this.prisma.payment.findMany({
        where: { status: 'completed' },
        select: { userId: true, amount: true, platformFee: true, netAmount: true, type: true, createdAt: true },
      }),
    ]);

    // ─── Par photographe ───────────────────────────────────────────────────
    const rows = users.map((u) => {
      const gs = galleries.filter((g) => g.userId === u.id);
      const ps = payments.filter((p) => p.userId === u.id);
      const dates = [...gs.map((g) => g.createdAt), ...ps.map((p) => p.createdAt)];
      return {
        ...u,
        galleries: gs.length,
        activeGalleries: gs.filter((g) => !g.isArchived && (!g.expiresAt || g.expiresAt > new Date())).length,
        openedGalleries: gs.filter((g) => g.firstOpenedAt).length,
        photos: gs.reduce((n, g) => n + g._count.photos, 0),
        sales: ps.length,
        gross: ps.reduce((n, p) => n + p.amount, 0),
        fees: ps.reduce((n, p) => n + p.platformFee, 0),
        net: ps.reduce((n, p) => n + p.netAmount, 0),
        lastActivity: dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString() : null,
      };
    });

    // ─── Séries jour par jour (30 jours glissants) ─────────────────────────
    const days: { date: string; signups: number; galleries: number; sales: number; gross: number; fees: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const inDay = (x: Date) => x >= d && x < next;
      const dayPayments = payments.filter((p) => inDay(p.createdAt));
      days.push({
        date: d.toISOString().slice(0, 10),
        signups: users.filter((u) => inDay(u.createdAt)).length,
        galleries: galleries.filter((g) => inDay(g.createdAt)).length,
        sales: dayPayments.length,
        gross: dayPayments.reduce((n, p) => n + p.amount, 0),
        fees: dayPayments.reduce((n, p) => n + p.platformFee, 0),
      });
    }

    // ─── Agrégats ──────────────────────────────────────────────────────────
    const gross = payments.reduce((n, p) => n + p.amount, 0);
    const fees = payments.reduce((n, p) => n + p.platformFee, 0);
    const photographers = users.filter((u) => u.role !== 'SUPERADMIN').length;
    const earning = rows.filter((r) => r.sales > 0).length;
    const byType: Record<string, { count: number; gross: number }> = {};
    for (const p of payments) {
      const k = p.type || 'autre';
      byType[k] = { count: (byType[k]?.count ?? 0) + 1, gross: (byType[k]?.gross ?? 0) + p.amount };
    }

    return {
      totals: {
        users: users.length,
        photographers,
        galleries: galleries.length,
        activeGalleries: galleries.filter((g) => !g.isArchived && (!g.expiresAt || g.expiresAt > new Date())).length,
        openedGalleries: galleries.filter((g) => g.firstOpenedAt).length,
        photos,
        sales: payments.length,
        gross,
        fees,
        net: payments.reduce((n, p) => n + p.netAmount, 0),
        averageBasket: payments.length ? gross / payments.length : 0,
        conversion: users.length ? (earning / users.length) * 100 : 0,
        openRate: galleries.length ? (galleries.filter((g) => g.firstOpenedAt).length / galleries.length) * 100 : 0,
      },
      byType,
      days,
      users: rows,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Vue plateforme (super-admin) */
  async listAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, studioName: true, role: true, createdAt: true, _count: { select: { galleries: true, payments: true } } },
    });
    const totals = await this.prisma.payment.aggregate({ where: { status: 'completed' }, _sum: { amount: true, platformFee: true, netAmount: true }, _count: true });
    return { users, totals: { sales: totals._count, gross: totals._sum.amount ?? 0, fees: totals._sum.platformFee ?? 0, net: totals._sum.netAmount ?? 0 } };
  }
}
