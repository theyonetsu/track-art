import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { GalleriesModule } from '../galleries/galleries.module';
import { EmailModule } from '../email/email.module';

@Module({ imports: [GalleriesModule, EmailModule], providers: [PaymentsService], controllers: [PaymentsController] })
export class PaymentsModule {}
