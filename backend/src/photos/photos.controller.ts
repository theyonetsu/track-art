import { Controller, Get, Post, Delete, Patch, Param, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('photos')
export class PhotosController {
  constructor(private svc: PhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('gallery/:galleryId/upload')
  @UseInterceptors(FilesInterceptor('photos', 50, { storage: memoryStorage() }))
  upload(
    @Param('galleryId') galleryId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.svc.uploadToGallery(galleryId, files);
  }

  @Get('gallery/:id')
  findByGallery(@Param('id') id: string) {
    return this.svc.findByGallery(id);
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
