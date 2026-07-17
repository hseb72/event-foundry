import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/** Reconnaît un Venue connu du référentiel (et sa ville, si renseignée). */
@Injectable()
export class VenueRule implements ClassificationRule {
  readonly name = 'VenueRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.reference.venues.find((venue) =>
      containsWord(context.normalizedText, venue.name),
    );
    if (match) {
      context.extractedFields.venue = match.name;
      if (match.city) {
        context.extractedFields.city = match.city;
      }
      context.confidenceByField.venue = 0.7;
    }
  }
}
