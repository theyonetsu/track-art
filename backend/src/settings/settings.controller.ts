import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
  @Get() get() { return this.settingsService.get(); }
  @Patch() update(@Body() body: any) { return this.settingsService.update(body); }
}
