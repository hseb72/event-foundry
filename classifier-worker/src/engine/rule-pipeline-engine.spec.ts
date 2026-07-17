import type { OCRResult } from '@event-foundry/contracts';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { EMPTY_SNAPSHOT } from '../reference/reference-snapshot';
import { normalize } from './text-utils';
import { RulePipelineEngine } from './rule-pipeline-engine';

function makeContext(text: string): ClassificationContext {
  return {
    ocr: { rawText: text } as unknown as OCRResult,
    normalizedText: normalize(text),
    reference: EMPTY_SNAPSHOT,
    extractedFields: {},
    confidenceByField: {},
    diagnostics: [],
  };
}

describe('RulePipelineEngine', () => {
  it('exécute les règles dans l\'ordre et agrège le contexte', async () => {
    const ruleA: ClassificationRule = {
      name: 'A',
      execute: async (context) => {
        context.extractedFields.title = 'Titre';
      },
    };
    const ruleB: ClassificationRule = {
      name: 'B',
      execute: async (context) => {
        context.extractedFields.city = 'Lyon';
      },
    };
    const engine = new RulePipelineEngine([ruleA, ruleB]);
    const context = makeContext('peu importe');

    await engine.run(context);

    expect(context.extractedFields.title).toBe('Titre');
    expect(context.extractedFields.city).toBe('Lyon');
  });

  it('isole l\'échec d\'une règle via un diagnostic sans interrompre les autres', async () => {
    const failing: ClassificationRule = {
      name: 'Failing',
      execute: async () => {
        throw new Error('boom');
      },
    };
    const following: ClassificationRule = {
      name: 'Following',
      execute: async (context) => {
        context.extractedFields.title = 'ok';
      },
    };
    const engine = new RulePipelineEngine([failing, following]);
    const context = makeContext('x');

    await engine.run(context);

    expect(context.extractedFields.title).toBe('ok');
    expect(context.diagnostics).toHaveLength(1);
    expect(context.diagnostics[0]).toMatchObject({ rule: 'Failing', level: 'ERROR' });
  });
});
