import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#1a1a1a;">Votre galerie photo est prête</h1>
            <p>Bonjour,</p>
            <p>Votre photographe a partagé la galerie <strong>${galleryTitle}</strong> avec vous.</p>
            <p style="margin:32px 0;">
              <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
                Voir ma galerie
              </a>
            </p>
            <p style="color:#666;font-size:14px;">Ce lien est valable 30 jours à partir de votre première ouverture.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
            <p style="color:#999;font-size:12px;">Track.Art — Galeries photo professionnelles</p>
          </div>`,
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
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#1a1a1a;">Votre galerie expire bientôt</h1>
            <p>La galerie <strong>${galleryTitle}</strong> expire dans <strong>${days} jour${days > 1 ? 's' : ''}</strong>.</p>
            <p>Sélectionnez et téléchargez vos photos avant cette date.</p>
            <p style="margin:32px 0;">
              <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
                Accéder à ma galerie
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
            <p style="color:#999;font-size:12px;">Track.Art — Galeries photo professionnelles</p>
          </div>`,
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
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#1a1a1a;">Paiement confirmé ✓</h1>
            <p><strong>${photoCount} photo${photoCount > 1 ? 's' : ''}</strong> de la galerie <strong>${galleryTitle}</strong> ont été déverrouillées.</p>
            <p style="margin:32px 0;">
              <a href="${galleryUrl}" style="background:#1a1a1a;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">
                Télécharger mes photos
              </a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
            <p style="color:#999;font-size:12px;">Track.Art — Galeries photo professionnelles</p>
          </div>`,
      });
      this.logger.log(`Confirmation paiement envoyée à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi confirmation à ${to} : ${err.message}`);
    }
  }
}
