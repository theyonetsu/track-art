import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { StorageModule } from '../storage/storage.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [StorageModule, EmailModule],
  providers: [JobsService],
})
export class JobsModule {}
