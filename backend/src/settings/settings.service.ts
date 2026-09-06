import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Champs entiers positifs modifiables par le super-admin */
const INT_FIELDS = ['includedPhotos', 'extraPhotoPrice', 'extensionPrice', 'extensionDays', 'expiryDays', 'priceMin', 'priceMax', 'maxExpiryDays'] as const;
const BOOL_FIELDS = ['allowPricing', 'allowExpiry', 'allowAllPhotos'] as const;

export type Policy = Awaited<ReturnType<SettingsService['policy']>>;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let s = await this.prisma.settings.findFirst();
    if (!s) s = await this.prisma.settings.create({ data: {} });
    return s;
  }

  /**
   * Ce que le photographe a le droit de régler, et les valeurs qui s'appliquent
   * quand il ne règle rien. Servi à l'espace photographe pour griser les champs.
   */
  async policy() {
    const s = await this.get();
    return {
      defaults: {
        includedPhotos: s.includedPhotos,
        extraPhotoPrice: s.extraPhotoPrice,
        allPhotosPrice: s.allPhotosPrice,
        extensionPrice: s.extensionPrice,
        extensionDays: s.extensionDays,
        expiryDays: s.expiryDays,
      },
      rights: {
        allowPricing: s.allowPricing,
        allowExpiry: s.allowExpiry,
        allowAllPhotos: s.allowAllPhotos,
        priceMin: s.priceMin,
        priceMax: s.priceMax,
        maxExpiryDays: s.maxExpiryDays,
      },
      commissionRate: s.commissionRate,
    };
  }

  /** Valide un prix saisi par un photographe (galerie ou reglage par defaut). */
  assertPrice(policy: Policy, label: string, value: number) {
    if (!policy.rights.allowPricing) throw new ForbiddenException(`${label} : les tarifs sont fixés par la plateforme.`);
    const { priceMin, priceMax } = policy.rights;
    if (value < priceMin || value > priceMax) throw new BadRequestException(`${label} : entre ${priceMin} € et ${priceMax} €.`);
  }

  /** Valide une duree (validite ou prolongation) saisie par un photographe. */
  assertDays(policy: Policy, label: string, value: number, isExpiry: boolean) {
    if (!policy.rights.allowExpiry) throw new ForbiddenException(`${label} : les durées sont fixées par la plateforme.`);
    if (value < 1) throw new BadRequestException(`${label} : au moins 1 jour.`);
    if (isExpiry && value > policy.rights.maxExpiryDays) throw new BadRequestException(`${label} : ${policy.rights.maxExpiryDays} jours maximum.`);
  }

  async update(data: Record<string, unknown>) {
    const s = await this.get();
    const clean: Record<string, unknown> = {};

    for (const k of INT_FIELDS) {
      if (!(k in data)) continue;
      const n = Number(data[k]);
      if (!Number.isInteger(n) || n < 0 || n > 100000) throw new BadRequestException(`Valeur invalide : ${k}`);
      clean[k] = n;
    }
    for (const k of BOOL_FIELDS) if (k in data) clean[k] = !!data[k];

    if ('allPhotosPrice' in data) {
      const v = data.allPhotosPrice;
      if (v === null || v === '' || v === undefined) clean.allPhotosPrice = null;
      else {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0 || n > 100000) throw new BadRequestException('Prix « toutes les photos » invalide');
        clean.allPhotosPrice = n;
      }
    }
    if ('commissionRate' in data) {
      const n = Number(data.commissionRate);
      if (isNaN(n) || n < 0 || n > 100) throw new BadRequestException('Commission entre 0 et 100 %');
      clean.commissionRate = n;
    }

    const next = { ...s, ...clean } as typeof s;
    if (next.expiryDays < 1 || next.extensionDays < 1) throw new BadRequestException('Les durées doivent valoir au moins 1 jour');
    if (next.priceMin > next.priceMax) throw new BadRequestException('Le prix minimum doit être inférieur au prix maximum');
    if (next.expiryDays > next.maxExpiryDays) throw new BadRequestException('La durée par défaut dépasse la durée maximale autorisée');

    return this.prisma.settings.update({ where: { id: s.id }, data: clean });
  }
}
