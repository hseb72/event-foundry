import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/**
 * Reconnaît un EventFormat (optionnel) dans le texte. Les Formats sont **transverses** (DATA.01 §4) :
 * ils ne dépendent pas de l'Activité détectée. La première correspondance trouvée est retenue.
 */
@Injectable()
export class EventFormatRule implements ClassificationRule {
  readonly name = 'EventFormatRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.reference.eventFormats.find((format) =>
      containsWord(context.normalizedText, format.name),
    );
    if (match) {
      context.extractedFields.eventFormat = match.name;
      context.confidenceByField.eventFormat = 0.75;
    }
  }
}
