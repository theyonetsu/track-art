import {
  Controller, Get, Post, Delete, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/tiff'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Controller('photos')
export class PhotosController {
  constructor(private svc: PhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('gallery/:galleryId/upload')
  @UseInterceptors(
    FilesInterceptor('photos', 50, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException(`Type non accepté : ${file.mimetype}. Formats supportés : JPEG, PNG, WEBP, HEIC, TIFF`), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @Param('galleryId') galleryId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('Aucune image fournie');
    return this.svc.uploadToGallery(galleryId, files);
  }

  /** Public — client gallery view (watermark + original if unlocked). */
  @Get('gallery/:id')
  findByGallery(@Param('id') id: string) {
    return this.svc.findByGallery(id);
  }

  /** Admin — full resolution preview for dashboard management. */
  @UseGuards(JwtAuthGuard)
  @Get('gallery/:id/admin')
  findByGalleryAdmin(@Param('id') id: string) {
    return this.svc.findByGalleryAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/price')
  updatePrice(@Param('id') id: string, @Body() body: { price: number }) {
    return this.svc.updatePrice(id, body.price);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/unlock')
  unlock(@Param('id') id: string) {
    return this.svc.unlock(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.deleteWithStorage(id);
  }
}
