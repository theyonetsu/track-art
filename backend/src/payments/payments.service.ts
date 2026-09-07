import { Injectable, BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GalleriesService } from '../galleries/galleries.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService, private galleries: GalleriesService, private email: EmailService) {}

  private split(amount: number, rate: number) {
    const platformFee = Math.round(amount * rate) / 100;
    return { commissionRate: rate, platformFee, netAmount: Math.round((amount - platformFee) * 100) / 100 };
  }

  private get base() {
    return process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getToken(): Promise<string> {
    const id = process.env.PAYPAL_CLIENT_ID ?? '';
    const secret = process.env.PAYPAL_CLIENT_SECRET ?? '';
    if (!id || !secret || id.startsWith('ton_') || secret.startsWith('ton_')) {
      throw new ServiceUnavailableException('Paiement indisponible : PayPal n\'est pas encore configuré (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).');
    }
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
      this.logger.error('PayPal auth failed: ' + JSON.stringify(data));
      throw new ServiceUnavailableException('Paiement indisponible : identifiants PayPal refusés.');
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

  async createOrder(galleryId: string, photoIds: string[], galleryToken?: string) {
    if (!Array.isArray(photoIds) || !photoIds.length) throw new BadRequestException('Aucune photo sélectionnée');
    const gallery = await this.galleries.assertPublicAccess(galleryId, galleryToken);
    const settings = await this.galleries.effectiveSettings(gallery);
    const { included, extras, total } = await this.splitSelection(galleryId, photoIds);
    if (total <= 0) {
      throw new BadRequestException('Cette sélection est incluse dans le forfait : utilisez la confirmation gratuite');
    }

    const allIds = [...included, ...extras].map((p) => p.id);
    const payment = await this.prisma.payment.create({
      data: { galleryId, userId: gallery.userId, type: 'BuyExtraPhotos', amount: total, photoIds: allIds, ...this.split(total, settings.commissionRate) },
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

    return this.applyPayment(payment);
  }

  /**
   * Applique un paiement confirmé (quel que soit le prestataire) :
   * marque le paiement payé puis déverrouille / prolonge selon son type.
   */
  private async applyPayment(payment: { id: string; type: string; galleryId: string; amount: number; photoIds: string[] }) {
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });

    if (payment.type === 'BuyAllPhotos') {
      const r = await this.prisma.photo.updateMany({ where: { galleryId: payment.galleryId, unlocked: false }, data: { unlocked: true, paid: true } });
      this.logger.log(`Paiement ${payment.id} — toutes les photos déverrouillées (${r.count})`);
      return { success: true, all: true, count: r.count };
    }

    if (payment.type === 'ExtendGallery') {
      const g = await this.prisma.gallery.findUnique({ where: { id: payment.galleryId } });
      const settings = await this.galleries.effectiveSettings(g);
      const base = g.expiresAt && g.expiresAt > new Date() ? g.expiresAt : new Date();
      const expiresAt = new Date(base.getTime() + settings.extensionDays * 86400000);
      await this.prisma.extension.create({ data: { galleryId: g.id, days: settings.extensionDays, amount: payment.amount } });
      await this.prisma.gallery.update({ where: { id: g.id }, data: { expiresAt } });
      this.logger.log(`Galerie ${g.id} prolongée de ${settings.extensionDays} jours`);
      return { success: true, extended: true, expiresAt };
    }

    // Photos : les incluses restent gratuites, le reste est marqué payé
    const { included, extras } = await this.splitSelection(payment.galleryId, payment.photoIds).catch(() => ({ included: [], extras: [] } as any));
    if (included.length) {
      await this.prisma.photo.updateMany({ where: { id: { in: included.map((p: any) => p.id) } }, data: { unlocked: true, paid: false } });
    }
    if (extras.length) {
      await this.prisma.photo.updateMany({ where: { id: { in: extras.map((p: any) => p.id) } }, data: { unlocked: true, paid: true } });
    }
    // Filet de sécurité : tout ce qui figure dans le paiement est déverrouillé
    await this.prisma.photo.updateMany({ where: { id: { in: payment.photoIds }, unlocked: false }, data: { unlocked: true, paid: true } });

    this.logger.log(`Paiement ${payment.id} — ${payment.photoIds.length} photos déverrouillées`);
    return { success: true, photoIds: payment.photoIds };
  }

  /** Prolongation payante de la galerie (prix et durée du photographe) */
  async createExtensionOrder(galleryId: string, token?: string) {
    const gallery = await this.galleries.assertPublicAccess(galleryId, token);
    const settings = await this.galleries.effectiveSettings(gallery);
    const total = settings.extensionPrice;
    if (total <= 0) throw new BadRequestException('La prolongation n\'est pas payante sur cette galerie');

    const payment = await this.prisma.payment.create({
      data: { galleryId, userId: gallery.userId, type: 'ExtendGallery', amount: total, photoIds: [], ...this.split(total, settings.commissionRate) },
    });
    const accessToken = await this.getToken();
    const res = await fetch(`${this.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': payment.id },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: payment.id, amount: { currency_code: 'EUR', value: total.toFixed(2) }, description: `Track.Art — Prolongation de galerie (${settings.extensionDays} jours)` }],
      }),
    });
    const order = await res.json() as any;
    if (!order.id) { this.logger.error('PayPal createOrder error: ' + JSON.stringify(order)); throw new BadRequestException('Erreur création commande PayPal'); }
    await this.prisma.payment.update({ where: { id: payment.id }, data: { paypalId: order.id } });
    return { paypalOrderId: order.id, internalId: payment.id, total, days: settings.extensionDays };
  }

  /** Achat de TOUTES les photos restantes au prix forfaitaire du photographe */
  async createAllPhotosOrder(galleryId: string, token?: string) {
    const gallery = await this.galleries.assertPublicAccess(galleryId, token);
    const settings = await this.galleries.effectiveSettings(gallery);
    if (!settings.allPhotosPrice || settings.allPhotosPrice <= 0) throw new BadRequestException('Cette galerie ne propose pas de forfait « toutes les photos »');
    const locked = await this.prisma.photo.findMany({ where: { galleryId, unlocked: false }, select: { id: true } });
    if (!locked.length) throw new BadRequestException('Toutes les photos sont déjà déverrouillées');
    const total = settings.allPhotosPrice;

    const payment = await this.prisma.payment.create({
      data: { galleryId, userId: gallery.userId, type: 'BuyAllPhotos', amount: total, photoIds: locked.map((p) => p.id), ...this.split(total, settings.commissionRate) },
    });
    const accessToken = await this.getToken();
    const res = await fetch(`${this.base}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': payment.id },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: payment.id, amount: { currency_code: 'EUR', value: total.toFixed(2) }, description: `Track.Art — Toutes les photos (${locked.length})` }],
      }),
    });
    const order = await res.json() as any;
    if (!order.id) { this.logger.error('PayPal createOrder error: ' + JSON.stringify(order)); throw new BadRequestException('Erreur création commande PayPal'); }
    await this.prisma.payment.update({ where: { id: payment.id }, data: { paypalId: order.id } });
    return { paypalOrderId: order.id, internalId: payment.id, total, count: locked.length };
  }

  // ─── Stripe (carte bancaire, Apple Pay, Google Pay) ────────────────────────

  private get stripeKey() {
    const k = process.env.STRIPE_SECRET_KEY ?? '';
    return k.startsWith('sk_') ? k : '';
  }

  get stripeEnabled() {
    return !!this.stripeKey;
  }

  /** Appel de l'API Stripe en form-urlencoded (aucune dépendance à installer). */
  private async stripeCall(path: string, method: 'GET' | 'POST', form?: Record<string, string>) {
    if (!this.stripeKey) {
      throw new ServiceUnavailableException("Paiement par carte indisponible : Stripe n'est pas encore configuré (STRIPE_SECRET_KEY).");
    }
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.stripeKey}`,
        ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      this.logger.error(`Stripe ${path} : ${JSON.stringify(data?.error ?? data)}`);
      throw new BadRequestException(data?.error?.message ?? 'Erreur Stripe');
    }
    return data;
  }

  /**
   * Prépare un paiement (photos supplémentaires, forfait complet ou prolongation)
   * et renvoie l'URL de la page de paiement Stripe.
   */
  async createStripeSession(kind: 'photos' | 'all' | 'extension', galleryId: string, photoIds: string[] = [], galleryToken?: string) {
    const gallery = await this.galleries.assertPublicAccess(galleryId, galleryToken);
    const settings = await this.galleries.effectiveSettings(gallery);

    let amount = 0, label = '', ids: string[] = [], type = '';
    if (kind === 'photos') {
      if (!Array.isArray(photoIds) || !photoIds.length) throw new BadRequestException('Aucune photo sélectionnée');
      const { included, extras, total } = await this.splitSelection(galleryId, photoIds);
      if (total <= 0) throw new BadRequestException('Cette sélection est incluse dans le forfait : utilisez la confirmation gratuite');
      amount = total; type = 'BuyExtraPhotos';
      ids = [...included, ...extras].map((p) => p.id);
      label = `${extras.length} photo(s) supplémentaire(s)`;
    } else if (kind === 'all') {
      if (!settings.allPhotosPrice || settings.allPhotosPrice <= 0) throw new BadRequestException("Cette galerie ne propose pas de forfait « toutes les photos »");
      const locked = await this.prisma.photo.findMany({ where: { galleryId, unlocked: false }, select: { id: true } });
      if (!locked.length) throw new BadRequestException('Toutes les photos sont déjà déverrouillées');
      amount = settings.allPhotosPrice; type = 'BuyAllPhotos';
      ids = locked.map((p) => p.id);
      label = `Toutes les photos (${locked.length})`;
    } else {
      if (settings.extensionPrice <= 0) throw new BadRequestException("La prolongation n'est pas payante sur cette galerie");
      amount = settings.extensionPrice; type = 'ExtendGallery';
      label = `Prolongation de la galerie (${settings.extensionDays} jours)`;
    }

    const payment = await this.prisma.payment.create({
      data: { galleryId, userId: gallery.userId, type, amount, photoIds: ids, ...this.split(amount, settings.commissionRate) },
    });

    const back = `${process.env.APP_URL ?? 'http://localhost:3000'}/g/${gallery.slug}`;
    const session = await this.stripeCall('/checkout/sessions', 'POST', {
      mode: 'payment',
      success_url: `${back}?paiement={CHECKOUT_SESSION_ID}`,
      cancel_url: `${back}?paiement=annule`,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][price_data][product_data][name]': `${gallery.title} — ${label}`,
      'metadata[paymentId]': payment.id,
      client_reference_id: payment.id,
      // La page Stripe suit la langue choisie pour la galerie, pas celle du navigateur
      locale: (['fr', 'en', 'es'].includes(gallery.languages?.[0]) ? gallery.languages[0] : 'auto'),
    });

    await this.prisma.payment.update({ where: { id: payment.id }, data: { paypalId: session.id } });
    this.logger.log(`Session Stripe ${session.id} (${amount} €, ${type})`);
    return { url: session.url as string, internalId: payment.id, total: amount };
  }

  /** Vérifie auprès de Stripe qu'une session est bien payée, puis applique le paiement. */
  async confirmStripeSession(sessionId: string) {
    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new BadRequestException('Session invalide');
    const session = await this.stripeCall(`/checkout/sessions/${sessionId}`, 'GET');
    const paymentId = session?.metadata?.paymentId ?? session?.client_reference_id;
    if (!paymentId) throw new BadRequestException('Session sans référence de paiement');

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new BadRequestException('Paiement introuvable');
    if (payment.status === 'completed') return { success: true, already: true, photoIds: payment.photoIds };
    if (session.payment_status !== 'paid') throw new BadRequestException('Paiement non confirmé par Stripe');
    if (Math.round(payment.amount * 100) !== Number(session.amount_total)) {
      this.logger.error(`Montant Stripe incohérent pour ${paymentId} : ${session.amount_total} vs ${payment.amount * 100}`);
      throw new BadRequestException('Montant incohérent');
    }
    return this.applyPayment(payment);
  }

  /** Moyens de paiement actifs, pour l'affichage côté client. */
  availableMethods() {
    const id = process.env.PAYPAL_CLIENT_ID ?? '';
    return {
      paypal: !!id && !id.startsWith('ton_'),
      card: this.stripeEnabled,
    };
  }

  /** Historique des ventes du photographe */
  async listForUser(actor: { sub: string; role: string }) {
    return this.prisma.payment.findMany({
      where: { ...(actor.role === 'SUPERADMIN' ? {} : { userId: actor.sub }) },
      include: { gallery: { select: { id: true, title: true, clientName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
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
