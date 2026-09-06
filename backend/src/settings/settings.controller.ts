import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SuperAdminGuard } from '../auth/roles.guard';

/** Réglages de la plateforme (commission, valeurs par défaut, droits) — super-admin uniquement */
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
  @Get() get() { return this.settingsService.get(); }
  @Patch() update(@Body() body: Record<string, unknown>) { return this.settingsService.update(body); }
}

/** Ce que le photographe connecté a le droit de régler, et les valeurs par défaut appliquées sinon */
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class PolicyController {
  constructor(private settingsService: SettingsService) {}
  @Get('policy') policy() { return this.settingsService.policy(); }
}
