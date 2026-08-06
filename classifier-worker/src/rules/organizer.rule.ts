import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { matchAll } from '../engine/reference-match';

/** Reconnaît un Organizer connu du référentiel, par son nom ou l'un de ses alias (sigle, enseigne). */
@Injectable()
export class OrganizerRule implements ClassificationRule {
  readonly name = 'OrganizerRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = matchAll(context.normalizedText, context.reference.organizers)[0];
    if (match) {
      context.extractedFields.organizer = match.entry.name;
      context.confidenceByField.organizer = match.kind === 'NAME' ? 0.7 : 0.6;
    }
  }
}
