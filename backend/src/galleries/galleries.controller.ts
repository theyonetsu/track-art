import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @Get(':slug')
  findOne(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
