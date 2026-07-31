import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

/** Heuristique simple : première ligne significative comme titre proposé. */
@Injectable()
export class TitleRule implements ClassificationRule {
  readonly name = 'TitleRule';

  async execute(context: ClassificationContext): Promise<void> {
    const firstLine = context.ocr.rawText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length >= 3);
    if (firstLine) {
      context.extractedFields.title = firstLine.slice(0, 200);
      context.confidenceByField.title = 0.5;
    }
  }
}
