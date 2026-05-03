import { Module } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { GalleriesController } from './galleries.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [GalleriesService],
  controllers: [GalleriesController],
  exports: [GalleriesService],
})
export class GalleriesModule {}
