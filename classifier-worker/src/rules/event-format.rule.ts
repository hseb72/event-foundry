import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/** Reconnaît l'EventFormat (optionnel) parmi ceux de l'Activity détectée. */
@Injectable()
export class EventFormatRule implements ClassificationRule {
  readonly name = 'EventFormatRule';

  async execute(context: ClassificationContext): Promise<void> {
    const activityName = context.extractedFields.activity;
    if (!activityName) {
      return;
    }
    const activity = context.reference.activities.find((a) => a.name === activityName);
    if (!activity) {
      return;
    }
    const match = context.reference.eventFormats
      .filter((format) => format.activityId === activity.id)
      .find((format) => containsWord(context.normalizedText, format.name));
    if (match) {
      context.extractedFields.eventFormat = match.name;
      context.confidenceByField.eventFormat = 0.75;
    }
  }
}
