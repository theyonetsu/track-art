import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/**
 * Valeurs qui « remplissent » une variable sans la configurer : gabarits laissés
 * dans le fichier d'exemple, domaines de documentation. Les compter comme
 * configurées faisait mentir la sonde — /health annonçait « smtp: configured »
 * alors que SMTP_HOST valait smtp.example.com et qu'aucun e-mail ne partait.
 */
const PLACEHOLDER = /^(ton_|votre_|your_|xxx|changeme|<)|example\.(com|org)$|^$/i;

function state(value: string | undefined, extra?: (v: string) => boolean) {
  const v = (value ?? '').trim();
  if (!v) return 'missing';
  if (PLACEHOLDER.test(v)) return 'placeholder';
  if (extra && !extra(v)) return 'invalid';
  return 'configured';
}

/** Sonde de santé pour l'hébergeur (Railway, uptime monitors). */
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    const paypal = state(process.env.PAYPAL_CLIENT_ID);
    const paypalSecret = state(process.env.PAYPAL_CLIENT_SECRET);
    const smtp = state(process.env.SMTP_HOST);
    const smtpUser = state(process.env.SMTP_USER);
    const storage = process.env.R2_ENDPOINT ? 'r2' : 'minio';

    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      paypal: paypal === 'configured' && paypalSecret === 'configured' ? 'configured' : paypal === 'configured' ? paypalSecret : paypal,
      stripe: state(process.env.STRIPE_SECRET_KEY, (v) => v.startsWith('sk_')),
      smtp: smtp === 'configured' && smtpUser === 'configured' ? 'configured' : smtp === 'configured' ? smtpUser : smtp,
      storage,
      mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
      time: new Date().toISOString(),
    };
  }
}
