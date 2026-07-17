import { Module } from '@nestjs/common';
import { ImportsController } from './controllers/imports.controller';
import { ImportJobRepository } from './repositories/import-job.repository';
import { ImportsService } from './services/imports.service';

/**
 * Acquisition (EPIC 5, FSPEC.01, TSPEC.06). Stockage MinIO + files BullMQ fournis par les
 * modules globaux MinioModule et QueueModule.
 */
@Module({
  controllers: [ImportsController],
  providers: [ImportsService, ImportJobRepository],
  exports: [ImportJobRepository],
})
export class ImportsModule {}
