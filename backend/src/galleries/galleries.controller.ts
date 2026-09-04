import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('galleries')
export class GalleriesController {
  constructor(private svc: GalleriesService) {}

  // ─── Photographe ─────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard) @Post()
  create(@Req() req, @Body() body: Record<string, unknown>) { return this.svc.create(req.user, body); }

  @UseGuards(JwtAuthGuard) @Get()
  findAll(@Req() req) { return this.svc.findAll(req.user); }

  @UseGuards(JwtAuthGuard) @Get('manage/:id')
  findById(@Req() req, @Param('id') id: string) { return this.svc.findById(id, req.user); }

  @UseGuards(JwtAuthGuard) @Patch('manage/:id')
  update(@Req() req, @Param('id') id: string, @Body() body: Record<string, unknown>) { return this.svc.update(id, req.user, body); }

  @UseGuards(JwtAuthGuard) @Post('manage/:id/send-link')
  sendLink(@Req() req, @Param('id') id: string) { return this.svc.sendLink(id, req.user); }

  @UseGuards(JwtAuthGuard) @Post('manage/:id/reset-expiry')
  resetExpiry(@Req() req, @Param('id') id: string) { return this.svc.resetExpiry(id, req.user); }

  @UseGuards(JwtAuthGuard) @Post('manage/:id/extend')
  extend(@Req() req, @Param('id') id: string, @Body() body: { days: number }) { return this.svc.extend(id, req.user, body?.days); }

  @UseGuards(JwtAuthGuard) @Delete('manage/:id')
  delete(@Req() req, @Param('id') id: string) { return this.svc.delete(id, req.user); }

  // ─── Client (public) ─────────────────────────────────────────────────────
  @Get(':slug')
  findOne(@Param('slug') slug: string, @Headers('x-gallery-token') token?: string) { return this.svc.findBySlug(slug, token); }

  @Post(':slug/access')
  access(@Param('slug') slug: string, @Body() body: { password: string }) { return this.svc.access(slug, body?.password); }

  @Post(':slug/confirm-selection')
  confirmSelection(@Param('slug') slug: string, @Body() body: { photoIds: string[] }, @Headers('x-gallery-token') token?: string) {
    return this.svc.confirmSelection(slug, body?.photoIds ?? [], token);
  }
}
