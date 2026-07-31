import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

/** Détection de prix (« 12€ », « 12,50 € », « gratuit », « entrée libre »). */
@Injectable()
export class PriceRule implements ClassificationRule {
  readonly name = 'PriceRule';

  async execute(context: ClassificationContext): Promise<void> {
    if (/\bgratuit\b|\bentree libre\b/.test(context.normalizedText)) {
      context.extractedFields.price = 0;
      context.extractedFields.currency = 'EUR';
      context.confidenceByField.price = 0.8;
      return;
    }

    const match = context.ocr.rawText.match(/(\d{1,4})(?:[.,](\d{1,2}))?\s*(?:€|eur|euros?)/i);
    if (match) {
      const decimals = match[2] ? `.${match[2]}` : '';
      context.extractedFields.price = Number(`${match[1]}${decimals}`);
      context.extractedFields.currency = 'EUR';
      context.confidenceByField.price = 0.85;
    }
  }
}
