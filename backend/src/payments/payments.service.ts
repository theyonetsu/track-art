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

  async createOrder(galleryId: string, photoIds: string[]) {
    const photos = await this.prisma.photo.findMany({
      where: { id: { in: photoIds }, galleryId },
    });
    if (!photos.length) throw new BadRequestException('Aucune photo valide sélectionnée');

    const total = photos.reduce((sum, p) => sum + p.price, 0);

    const payment = await this.prisma.payment.create({
      data: { galleryId, type: 'photos', amount: total, photoIds },
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
          description: 'Track.Art — Photos déverrouillées',
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

    this.logger.log(`Order created: ${order.id} (${total}€, ${photoIds.length} photos)`);
    return { paypalOrderId: order.id, internalId: payment.id };
  }

  async captureOrder(paypalOrderId: string, internalId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: internalId } });
    if (!payment) throw new BadRequestException('Paiement introuvable');
    if (payment.status === 'completed') {
      return { success: true, photoIds: payment.photoIds };
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

    const updated = await this.prisma.payment.update({
      where: { id: internalId },
      data: { status: 'completed' },
    });

    await this.prisma.photo.updateMany({
      where: { id: { in: updated.photoIds } },
      data: { unlocked: true },
    });

    this.logger.log(`Payment captured: ${internalId} — ${updated.photoIds.length} photos déverrouillées`);
    return { success: true, photoIds: updated.photoIds };
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
