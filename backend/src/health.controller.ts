import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/** Sonde de santé pour l'hébergeur (Railway, uptime monitors). */
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    let db = 'ok';
    try { await this.prisma.$queryRaw`SELECT 1`; } catch { db = 'error'; }
    return { status: db === 'ok' ? 'ok' : 'degraded', db, paypal: process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_ID.startsWith('ton_') ? 'configured' : 'missing', stripe: (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_') ? 'configured' : 'missing', smtp: process.env.SMTP_HOST ? 'configured' : 'missing', storage: process.env.R2_ENDPOINT ? 'r2' : 'minio', time: new Date().toISOString() };
  }
}
