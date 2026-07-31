import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/**
 * Reconnaît l'EventType (nature du rassemblement). **Transverse** (DATA.01 v2.0) : indépendant de
 * l'Activité détectée — recherché par nom dans tout le référentiel. La correspondance la plus
 * longue l'emporte (« Avant-première » avant « Première »).
 */
@Injectable()
export class EventTypeRule implements ClassificationRule {
  readonly name = 'EventTypeRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.reference.eventTypes
      .filter((type) => containsWord(context.normalizedText, type.name))
      .sort((a, b) => b.name.length - a.name.length)[0];
    if (match) {
      context.extractedFields.eventType = match.name;
      context.confidenceByField.eventType = 0.8;
    }
  }
}
