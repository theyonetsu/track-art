import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { StorageModule } from '../storage/storage.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { GalleriesModule } from '../galleries/galleries.module';

@Module({
  imports: [StorageModule, ImageProcessingModule, GalleriesModule],
  providers: [PhotosService],
  controllers: [PhotosController],
  exports: [PhotosService],
})
export class PhotosModule {}
