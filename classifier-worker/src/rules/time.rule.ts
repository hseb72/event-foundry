import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Détection d'heure (« 19h », « 19h30 », « 19:30 »). N'a d'effet que si une date a déjà
 * été détectée : l'heure vient compléter startsAt.
 */
@Injectable()
export class TimeRule implements ClassificationRule {
  readonly name = 'TimeRule';

  async execute(context: ClassificationContext): Promise<void> {
    const current = context.extractedFields.startsAt;
    if (!current) {
      return;
    }
    const match = context.ocr.rawText.match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
    if (!match) {
      return;
    }
    const hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    if (hours > 23 || minutes > 59) {
      return;
    }
    context.extractedFields.startsAt = current.replace(
      /T\d{2}:\d{2}/,
      `T${pad(hours)}:${pad(minutes)}`,
    );
    context.confidenceByField.startsAt = Math.max(context.confidenceByField.startsAt ?? 0, 0.85);
  }
}
