import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/** Reconnaît l'EventType parmi ceux de l'Activity détectée. */
@Injectable()
export class EventTypeRule implements ClassificationRule {
  readonly name = 'EventTypeRule';

  async execute(context: ClassificationContext): Promise<void> {
    const activityName = context.extractedFields.activity;
    if (!activityName) {
      return;
    }
    const activity = context.reference.activities.find((a) => a.name === activityName);
    if (!activity) {
      return;
    }
    const match = context.reference.eventTypes
      .filter((type) => type.activityId === activity.id)
      .find((type) => containsWord(context.normalizedText, type.name));
    if (match) {
      context.extractedFields.eventType = match.name;
      context.confidenceByField.eventType = 0.8;
    }
  }
}
