import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  private get base() {
    return process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getToken(): Promise<string> {
    const creds = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
    ).toString('base64');

    const res = await fetch(`${this.base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json() as any;
    if (!data.access_token) {
      throw new Error('PayPal auth failed: ' + JSON.stringify(data));
    }
    return data.access_token;
  }

  /** Photos incluses déjà consommées (déverrouillées sans paiement). */
  private async includedRemaining(galleryId: string, maxSelection: number) {
    const used = await this.prisma.photo.count({ where: { galleryId, unlocked: true, paid: false } });
    return Math.max(0, maxSelection - used);
  }

  /**
   * Découpe une sélection en photos incluses (gratuites) et extras (payantes).
   * Les photos déjà déverrouillées sont ignorées.
   */
  private async splitSelection(galleryId: string, photoIds: string[]) {
    const gallery = await this.prisma.gallery.findUnique({ where: { id: galleryId } });
    if (!gallery) throw new BadRequestException('Galerie introuvable');
    if (gallery.expiresAt && gallery.expiresAt < new Date()) throw new BadRequestException('Galerie expirée');

    const photos = await this.prisma.photo.findMany({
      where: { id: { in: photoIds }, galleryId, unlocked: false },
    });
    // Conserver l'ordre de sélection du client
    const ordered = photoIds.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as typeof photos;
    if (!ordered.length) throw new BadRequestException('Aucune photo valide sélectionnée');

    const remaining = await this.includedRemaining(galleryId, gallery.maxSelection);
    const included = ordered.slice(0, remaining);
    const extras = ordered.slice(remaining);
    const total = extras.reduce((sum, p) => sum + p.price, 0);
    return { included, extras, total };
  }

  async createOrder(galleryId: string, photoIds: string[]) {
    if (!Array.isArray(photoIds) || !photoIds.length) throw new BadRequestException('Aucune photo sélectionnée');
    const { included, extras, total } = await this.splitSelection(galleryId, photoIds);
    if (total <= 0) {
      throw new BadRequestException('Cette sélection est incluse dans le forfait : utilisez la confirmation gratuite');
    }

    const allIds = [...included, ...extras].map((p) => p.id);
    const payment = await this.prisma.payment.create({
      data: { galleryId, type: 'BuyExtraPhotos', amount: total, photoIds: allIds },
    });

    const token = await this.getToken();
    const res = await fetch(`${this.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': payment.id,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: payment.id,
          amount: { currency_code: 'EUR', value: total.toFixed(2) },
          description: `Track.Art — ${extras.length} photo(s) supplémentaire(s)`,
        }],
      }),
    });

    const order = await res.json() as any;
    if (!order.id) {
      this.logger.error('PayPal createOrder error: ' + JSON.stringify(order));
      throw new BadRequestException('Erreur création commande PayPal');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paypalId: order.id },
    });

    this.logger.log(`Order created: ${order.id} (${total}€, ${extras.length} extras + ${included.length} incluses)`);
    return { paypalOrderId: order.id, internalId: payment.id, total, extraCount: extras.length };
  }

  async captureOrder(paypalOrderId: string, internalId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: internalId } });
    if (!payment) throw new BadRequestException('Paiement introuvable');
    if (payment.status === 'completed') {
      return { success: true, photoIds: payment.photoIds };
    }
    if (payment.paypalId && payment.paypalId !== paypalOrderId) {
      throw new BadRequestException('Commande PayPal incohérente');
    }

    const token = await this.getToken();
    const res = await fetch(`${this.base}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `capture-${internalId}`,
      },
    });

    const capture = await res.json() as any;
    if (capture.status !== 'COMPLETED') {
      this.logger.error('PayPal capture not completed: ' + JSON.stringify(capture));
      throw new BadRequestException('Paiement non complété');
    }

    await this.prisma.payment.update({
      where: { id: internalId },
      data: { status: 'completed' },
    });

    // Déverrouillage : les photos incluses restent gratuites, le reste est marqué payé
    const { included, extras } = await this.splitSelection(payment.galleryId, payment.photoIds).catch(() => ({ included: [], extras: [] } as any));
    if (included.length) {
      await this.prisma.photo.updateMany({ where: { id: { in: included.map((p: any) => p.id) } }, data: { unlocked: true, paid: false } });
    }
    if (extras.length) {
      await this.prisma.photo.updateMany({ where: { id: { in: extras.map((p: any) => p.id) } }, data: { unlocked: true, paid: true } });
    }
    // Filet de sécurité : tout ce qui figure dans le paiement est déverrouillé
    await this.prisma.photo.updateMany({ where: { id: { in: payment.photoIds }, unlocked: false }, data: { unlocked: true, paid: true } });

    this.logger.log(`Payment captured: ${internalId} — ${payment.photoIds.length} photos déverrouillées`);
    return { success: true, photoIds: payment.photoIds };
  }

  async createPayment(data: any) {
    return this.prisma.payment.create({ data });
  }

  async confirmPayment(paypalId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { paypalId } });
    if (!payment) return null;
    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });
  }
}
