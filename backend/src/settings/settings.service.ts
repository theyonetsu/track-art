import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let s = await this.prisma.settings.findFirst();
    if (!s) s = await this.prisma.settings.create({ data: {} });
    return s;
  }

  async update(data: any) {
    const s = await this.get();
    return this.prisma.settings.update({ where: { id: s.id }, data });
  }
}
