import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/**
 * Reconnaît les **Modalités** (Axe C — DATA.01 v2.0) présentes dans le texte (Présentiel, Payant,
 * Compétitif, Draft…). Référentiel transverse, cardinalité 0..N : toutes les correspondances sont
 * retenues. Ne se substitue jamais aux champs techniques (`price`, `visibility`) — TAX-010.
 */
@Injectable()
export class ModalityRule implements ClassificationRule {
  readonly name = 'ModalityRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = context.reference.modalities.filter((modality) =>
      containsWord(context.normalizedText, modality.name),
    );
    if (matches.length === 0) {
      return;
    }
    context.extractedFields.modalities = matches.map((modality) => modality.name);
    context.confidenceByField.modalities = 0.7;
  }
}
