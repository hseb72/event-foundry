import { Inject, Injectable } from '@nestjs/common';
import type { ClassificationResult, OCRResult } from '@event-foundry/contracts';
import type { ClassificationContext } from './classification-rule.interface';
import { RulePipelineEngine } from './engine/rule-pipeline-engine';
import { normalize } from './engine/text-utils';
import {
  REFERENCE_DATA_PROVIDER,
  type ReferenceDataProvider,
} from './reference/reference-data-provider.interface';

/**
 * Transforme un OCRResult en ClassificationResult (TSPEC.05). Charge l'instantané des
 * référentiels, construit le contexte, exécute la chaîne de règles, agrège le résultat.
 * Aucune persistance, aucune écriture d'Event.
 */
@Injectable()
export class ClassifierProcessor {
  constructor(
    @Inject(REFERENCE_DATA_PROVIDER) private readonly reference: ReferenceDataProvider,
    private readonly engine: RulePipelineEngine,
  ) {}

  async process(ocr: OCRResult): Promise<ClassificationResult> {
    const reference = await this.reference.getSnapshot();
    const context: ClassificationContext = {
      ocr,
      normalizedText: normalize(ocr.rawText),
      reference,
      extractedFields: {},
      confidenceByField: {},
      diagnostics: [],
    };

    await this.engine.run(context);

    return {
      importJobId: ocr.importJobId,
      extractedFields: context.extractedFields,
      confidenceByField: context.confidenceByField,
      diagnostics: context.diagnostics,
      correlationId: ocr.correlationId,
    };
  }
}
