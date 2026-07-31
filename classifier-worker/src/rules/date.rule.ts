import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
};

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}T00:00:00.000Z`;
}

/**
 * Détection de date. Formats reconnus : « 12 juillet 2024 » (fort) et « 12/07/2024 »
 * (numérique). La date est stockée en UTC à minuit ; l'heure est ajoutée par TimeRule.
 */
@Injectable()
export class DateRule implements ClassificationRule {
  readonly name = 'DateRule';

  async execute(context: ClassificationContext): Promise<void> {
    const literal = context.normalizedText.match(
      /(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/,
    );
    if (literal) {
      const iso = toIsoDate(Number(literal[3]), MONTHS[literal[2]], Number(literal[1]));
      if (iso) {
        context.extractedFields.startsAt = iso;
        context.confidenceByField.startsAt = 0.9;
        return;
      }
    }

    const numeric = context.ocr.rawText.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
    if (numeric) {
      const year = Number(numeric[3]);
      const iso = toIsoDate(year < 100 ? 2000 + year : year, Number(numeric[2]), Number(numeric[1]));
      if (iso) {
        context.extractedFields.startsAt = iso;
        context.confidenceByField.startsAt = 0.7;
      }
    }
  }
}
