import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const PROFILE_FIELDS = ['name', 'studioName', 'phone', 'website', 'watermarkText'] as const;
const DEFAULT_FIELDS = ['defaultIncluded', 'defaultExtraPhotoPrice', 'defaultExtensionPrice', 'defaultExtensionDays', 'defaultExpiryDays'] as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    const data: Record<string, unknown> = {};
    for (const f of PROFILE_FIELDS) if (f in body) data[f] = body[f] === '' ? null : body[f];
    for (const f of DEFAULT_FIELDS) {
      if (f in body) {
        const n = Number(body[f]);
        if (!Number.isInteger(n) || n < 0 || n > 10000) throw new BadRequestException(`Valeur invalide pour ${f}`);
        data[f] = n;
      }
    }
    if ('defaultIncluded' in data && (data.defaultIncluded as number) < 1) throw new BadRequestException('Au moins 1 photo incluse');
    if ('defaultExpiryDays' in data && (data.defaultExpiryDays as number) < 1) throw new BadRequestException('Au moins 1 jour');
    if ('defaultExtensionDays' in data && (data.defaultExtensionDays as number) < 1) throw new BadRequestException('Au moins 1 jour');
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
