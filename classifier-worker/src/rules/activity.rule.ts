import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { matchAll } from '../engine/reference-match';

/**
 * Reconnaît l'Activity via les référentiels (nom + alias). Le Domain n'est jamais
 * recherché : il est déduit de l'Activity par le Backend (ARCHI.02).
 */
@Injectable()
export class ActivityRule implements ClassificationRule {
  readonly name = 'ActivityRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = matchAll(context.normalizedText, context.reference.activities);
    if (matches.length === 0) {
      return;
    }

    // Nom d'abord (matchAll les place en tête), puis libellé le plus long : « Jeu de rôle » avant
    // « Jeu » quand les deux figurent au référentiel.
    const byName = matches.filter((m) => m.kind === 'NAME');
    const pool = byName.length ? byName : matches;
    const chosen = [...pool].sort((a, b) => b.entry.name.length - a.entry.name.length)[0];

    context.extractedFields.activity = chosen.entry.name;
    context.confidenceByField.activity = chosen.kind === 'NAME' ? 0.95 : 0.85;

    if (new Set(matches.map((m) => m.entry.id)).size > 1) {
      context.diagnostics.push({
        rule: this.name,
        level: 'WARNING',
        field: 'activity',
        message: `Plusieurs activités possibles : ${matches.map((m) => m.entry.name).join(', ')}.`,
      });
    }
  }
}
