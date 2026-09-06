import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GalleriesService } from './galleries.service';
import { GalleriesController } from './galleries.controller';
import { SettingsModule } from '../settings/settings.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule, SettingsModule, JwtModule.register({ secret: process.env.JWT_ACCESS_SECRET })],
  providers: [GalleriesService],
  controllers: [GalleriesController],
  exports: [GalleriesService],
})
export class GalleriesModule {}
