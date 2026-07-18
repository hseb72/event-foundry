import { Module } from '@nestjs/common';
import { OcrResultConsumer } from './consumers/ocr-result.consumer';
import { ImportsController } from './controllers/imports.controller';
import { ImportJobRepository } from './repositories/import-job.repository';
import { ImportsService } from './services/imports.service';

/**
 * Acquisition (EPIC 5, FSPEC.01, TSPEC.06). Stockage MinIO + files BullMQ fournis par les
 * modules globaux MinioModule et QueueModule. Le Backend orchestre chaque étape : il
 * consomme OCR_RESULT_QUEUE (OcrResultConsumer) pour enchaîner sur la classification.
 */
@Module({
  controllers: [ImportsController],
  providers: [ImportsService, ImportJobRepository, OcrResultConsumer],
  exports: [ImportJobRepository],
})
export class ImportsModule {}
