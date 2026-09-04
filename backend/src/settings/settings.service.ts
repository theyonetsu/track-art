import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let s = await this.prisma.settings.findFirst();
    if (!s) s = await this.prisma.settings.create({ data: {} });
    return s;
  }

  async update(data: { extensionPrice?: number; extensionDays?: number; extraPhotoPrice?: number; commissionRate?: number }) {
    const s = await this.get();
    const clean: Record<string, number> = {};
    for (const k of ['extensionPrice', 'extensionDays', 'extraPhotoPrice'] as const) {
      if (k in data) { const n = Number(data[k]); if (!Number.isInteger(n) || n < 0) throw new BadRequestException(`Valeur invalide : ${k}`); clean[k] = n; }
    }
    if ('commissionRate' in data) { const n = Number(data.commissionRate); if (isNaN(n) || n < 0 || n > 100) throw new BadRequestException('Commission entre 0 et 100 %'); clean.commissionRate = n; }
    return this.prisma.settings.update({ where: { id: s.id }, data: clean });
  }
}
