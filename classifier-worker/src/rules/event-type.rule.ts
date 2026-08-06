import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { matchAll } from '../engine/reference-match';

/**
 * Reconnaît l'EventType (nature du rassemblement). **Transverse** (DATA.01 v2.0) : indépendant de
 * l'Activité détectée — recherché par nom **ou par alias** dans tout le référentiel. À mode de
 * reconnaissance égal, la correspondance la plus longue l'emporte (« Avant-première » avant
 * « Première »).
 */
@Injectable()
export class EventTypeRule implements ClassificationRule {
  readonly name = 'EventTypeRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = matchAll(context.normalizedText, context.reference.eventTypes);
    if (matches.length === 0) {
      return;
    }
    const byName = matches.filter((m) => m.kind === 'NAME');
    const pool = byName.length ? byName : matches;
    const chosen = [...pool].sort((a, b) => b.entry.name.length - a.entry.name.length)[0];

    context.extractedFields.eventType = chosen.entry.name;
    context.confidenceByField.eventType = chosen.kind === 'NAME' ? 0.8 : 0.7;
  }
}
