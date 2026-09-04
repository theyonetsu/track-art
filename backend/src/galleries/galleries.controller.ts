import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('galleries')
export class GalleriesController {
  constructor(private svc: GalleriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) { return this.svc.create(body); }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.svc.findAll(); }

  // Admin manage routes — declared BEFORE :slug to avoid routing conflict
  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  findById(@Param('id') id: string) { return this.svc.findById(id); }

  @UseGuards(JwtAuthGuard)
  @Patch('manage/:id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @UseGuards(JwtAuthGuard)
  @Post('manage/:id/send-link')
  sendLink(@Param('id') id: string) { return this.svc.sendLink(id); }

  // Public — must come after static routes
  @Get(':slug')
  findOne(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  // Public — le client confirme les photos incluses dans son forfait (gratuit)
  @Post(':slug/confirm-selection')
  confirmSelection(@Param('slug') slug: string, @Body() body: { photoIds: string[] }) {
    return this.svc.confirmSelection(slug, body?.photoIds ?? []);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
