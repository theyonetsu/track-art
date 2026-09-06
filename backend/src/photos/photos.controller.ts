import {
  Controller, Get, Post, Delete, Patch, Param, Body, Req, Headers,
  UseGuards, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/tiff'];
const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80 Mo

@Controller('photos')
export class PhotosController {
  constructor(private svc: PhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('gallery/:galleryId/upload')
  @UseInterceptors(FilesInterceptor('photos', 20, {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) return cb(new BadRequestException(`Type non accepté : ${file.mimetype}. Formats : JPEG, PNG, WEBP, HEIC, TIFF`), false);
      cb(null, true);
    },
  }))
  upload(@Req() req, @Param('galleryId') galleryId: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Aucune image fournie');
    return this.svc.uploadToGallery(galleryId, req.user, files);
  }

  /** Public */
  @Get('gallery/:id')
  findByGallery(@Param('id') id: string, @Headers('x-gallery-token') token?: string) { return this.svc.findByGallery(id, token); }

  @UseGuards(JwtAuthGuard) @Get('gallery/:id/admin')
  findByGalleryAdmin(@Req() req, @Param('id') id: string) { return this.svc.findByGalleryAdmin(id, req.user); }

  @UseGuards(JwtAuthGuard) @Patch('gallery/:id/reorder')
  reorder(@Req() req, @Param('id') id: string, @Body() body: { ids: string[] }) { return this.svc.reorder(id, req.user, body?.ids ?? []); }

  @UseGuards(JwtAuthGuard) @Patch(':id/price')
  updatePrice(@Req() req, @Param('id') id: string, @Body() body: { price: number }) { return this.svc.updatePrice(id, req.user, body.price); }

  @UseGuards(JwtAuthGuard) @Patch(':id/unlock')
  unlock(@Req() req, @Param('id') id: string) { return this.svc.unlock(id, req.user); }

  @UseGuards(JwtAuthGuard) @Patch(':id/lock')
  lock(@Req() req, @Param('id') id: string) { return this.svc.lock(id, req.user); }

  @UseGuards(JwtAuthGuard) @Delete(':id')
  delete(@Req() req, @Param('id') id: string) { return this.svc.deleteWithStorage(id, req.user); }
}
