import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

/** Détection d'une URL dans le texte. */
@Injectable()
export class UrlRule implements ClassificationRule {
  readonly name = 'UrlRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.ocr.rawText.match(/https?:\/\/[^\s)]+/i);
    if (match) {
      context.extractedFields.url = match[0].replace(/[.,;]+$/, '');
      context.confidenceByField.url = 0.9;
    }
  }
}
