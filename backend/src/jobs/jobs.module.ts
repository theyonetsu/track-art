import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [JobsService],
})
export class JobsModule {}