import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/** Reconnaît un Organizer connu du référentiel. */
@Injectable()
export class OrganizerRule implements ClassificationRule {
  readonly name = 'OrganizerRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.reference.organizers.find((organizer) =>
      containsWord(context.normalizedText, organizer.name),
    );
    if (match) {
      context.extractedFields.organizer = match.name;
      context.confidenceByField.organizer = 0.7;
    }
  }
}
