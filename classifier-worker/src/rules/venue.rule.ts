import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { matchAll } from '../engine/reference-match';

/** Reconnaît un Venue connu du référentiel (et sa ville, si renseignée), par nom ou par alias. */
@Injectable()
export class VenueRule implements ClassificationRule {
  readonly name = 'VenueRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = matchAll(context.normalizedText, context.reference.venues)[0];
    if (match) {
      context.extractedFields.venue = match.entry.name;
      if (match.entry.city) {
        context.extractedFields.city = match.entry.city;
      }
      context.confidenceByField.venue = match.kind === 'NAME' ? 0.7 : 0.6;
    }
  }
}
