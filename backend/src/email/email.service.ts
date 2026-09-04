import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP non configuré — les emails ne seront pas envoyés. Renseignez SMTP_HOST et SMTP_USER dans .env');
      return;
    }
    try {
      await this.transporter.verify();
      this.logger.log(`SMTP connecté : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    } catch (err) {
      this.logger.error(`Impossible de se connecter au serveur SMTP : ${err.message}`);
    }
  }

  private get from() {
    return `"Track.Art" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
  }

  private isConfigured() {
    return !!process.env.SMTP_HOST && !!process.env.SMTP_USER;
  }

  async sendGalleryLink(to: string, galleryTitle: string, galleryUrl: string) {
    if (!this.isConfigured()) {
      this.logger.warn('SMTP non configuré — email non envoyé');
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: `Votre galerie photo : ${galleryTitle}`,
        html: this.wrapTemplate(`
          <h1 style="color:#1a1a1a;font-size:24px;margin-bottom:16px;">Votre galerie photo est prête</h1>
          <p style="color:#444;line-height:1.6;">Bonjour,</p>
          <p style="color:#444;line-height:1.6;">Votre photographe a partagé la galerie <strong>${galleryTitle}</strong> avec vous.</p>
          <p style="margin:32px 0;">
            <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
              Voir ma galerie
            </a>
          </p>
          <p style="color:#888;font-size:14px;">Ce lien est valable 30 jours à partir de votre première ouverture.</p>
        `),
      });
      this.logger.log(`Lien galerie envoyé à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi email à ${to} : ${err.message}`);
    }
  }

  async sendGalleryExpiryWarning(to: string, galleryTitle: string, expiresAt: Date, galleryUrl: string) {
    if (!this.isConfigured()) return;
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: `Votre galerie "${galleryTitle}" expire dans ${days} jour${days > 1 ? 's' : ''}`,
        html: this.wrapTemplate(`
          <h1 style="color:#c0392b;font-size:24px;margin-bottom:16px;">Votre galerie expire bientôt</h1>
          <p style="color:#444;line-height:1.6;">La galerie <strong>${galleryTitle}</strong> expire dans <strong>${days} jour${days > 1 ? 's' : ''}</strong>.</p>
          <p style="color:#444;line-height:1.6;">Sélectionnez et téléchargez vos photos avant cette date.</p>
          <p style="margin:32px 0;">
            <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
              Accéder à ma galerie
            </a>
          </p>
        `),
      });
      this.logger.log(`Avertissement expiration envoyé à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi expiration à ${to} : ${err.message}`);
    }
  }

  async sendPaymentConfirmation(to: string, galleryTitle: string, galleryUrl: string, photoCount: number) {
    if (!this.isConfigured()) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: `Paiement confirmé — ${galleryTitle}`,
        html: this.wrapTemplate(`
          <h1 style="color:#27ae60;font-size:24px;margin-bottom:16px;">Paiement confirmé ✓</h1>
          <p style="color:#444;line-height:1.6;"><strong>${photoCount} photo${photoCount > 1 ? 's' : ''}</strong> de la galerie <strong>${galleryTitle}</strong> ont été déverrouillées.</p>
          <p style="margin:32px 0;">
            <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
              Télécharger mes photos
            </a>
          </p>
        `),
      });
      this.logger.log(`Confirmation paiement envoyée à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi confirmation à ${to} : ${err.message}`);
    }
  }

  private wrapTemplate(content: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        ${content}
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
        <p style="color:#bbb;font-size:12px;text-align:center;">Track.Art — Galeries photo professionnelles</p>
      </div>`;
  }
}
