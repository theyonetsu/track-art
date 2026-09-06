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
      if (f === 'defaultIncluded' && n < 1) throw new BadRequestException('Au moins 1 photo incluse');
      data[f] = n;
    }

    await this.prisma.user.update({ where: { id: userId }, data });
    return this.me(userId);
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
