import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { IMPORT_CONNECTORS } from './connectors/import-connector';
import { CsvJsonConnector } from './connectors/csv-json.connector';
import { OcrResultConsumer } from './consumers/ocr-result.consumer';
import { ImportsController } from './controllers/imports.controller';
import { DeduplicateStage } from './pipeline/deduplicate.stage';
import { NormalizeStage } from './pipeline/normalize.stage';
import { ValidateStage } from './pipeline/validate.stage';
import { ImportJobRepository } from './repositories/import-job.repository';
import { ImportPipelineRepository } from './repositories/import-pipeline.repository';
import { ImportsService } from './services/imports.service';
import { StructuredImportService } from './services/structured-import.service';

/**
 * Acquisition (EPIC 5 + framework d'import V3 : ADR.13/14/15). Stockage MinIO + files BullMQ fournis
 * par les modules globaux MinioModule et QueueModule. Le Backend orchestre chaque étape : il consomme
 * OCR_RESULT_QUEUE (canal Image/PDF V2) et exécute en ligne le pipeline déterministe des canaux
 * structurés (CSV/JSON). Les connecteurs sont enregistrés dans le registry `IMPORT_CONNECTORS`
 * (résolution par canal — aucune modification du cœur pour en ajouter un).
 */
@Module({
  imports: [AiModule, PlatformConfigModule],
  controllers: [ImportsController],
  providers: [
    ImportsService,
    StructuredImportService,
    ImportJobRepository,
    ImportPipelineRepository,
    OcrResultConsumer,
    ValidateStage,
    NormalizeStage,
    DeduplicateStage,
    CsvJsonConnector,
    { provide: IMPORT_CONNECTORS, useFactory: (csv: CsvJsonConnector) => [csv], inject: [CsvJsonConnector] },
  ],
  exports: [ImportJobRepository],
})
export class ImportsModule {}
