import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/**
 * Reconnaît l'Activity via les référentiels (nom + alias). Le Domain n'est jamais
 * recherché : il est déduit de l'Activity par le Backend (ARCHI.02).
 */
@Injectable()
export class ActivityRule implements ClassificationRule {
  readonly name = 'ActivityRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = context.reference.activities.filter(
      (activity) =>
        containsWord(context.normalizedText, activity.name) ||
        activity.aliases.some((alias) => containsWord(context.normalizedText, alias)),
    );
    if (matches.length === 0) {
      return;
    }

    const byName = matches.filter((activity) => containsWord(context.normalizedText, activity.name));
    const chosen = [...(byName.length ? byName : matches)].sort(
      (a, b) => b.name.length - a.name.length,
    )[0];
    const exactName = containsWord(context.normalizedText, chosen.name);

    context.extractedFields.activity = chosen.name;
    context.confidenceByField.activity = exactName ? 0.95 : 0.85;

    if (new Set(matches.map((activity) => activity.id)).size > 1) {
      context.diagnostics.push({
        rule: this.name,
        level: 'WARNING',
        field: 'activity',
        message: `Plusieurs activités possibles : ${matches.map((a) => a.name).join(', ')}.`,
      });
    }
  }
}
