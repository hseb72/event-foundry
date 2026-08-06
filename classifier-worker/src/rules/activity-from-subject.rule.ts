import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

/**
 * Déduit l'**Activity** des **Sujets** reconnus, en remontant `Subject → Family → Activity`
 * (Axe A — DATA.01 v2.0).
 *
 * Raison d'être : depuis la taxonomie v2.0, les activités sont **généralistes** (Jeux, Musique,
 * Sport, Cinéma…) et n'apparaissent presque jamais telles quelles sur une affiche. Ce qu'un
 * document nomme, c'est le sujet — « Magic », « Rock », « Football ». Sans cette remontée,
 * l'activité, pourtant **obligatoire** sur un Event, restait vide alors même que la hiérarchie du
 * référentiel permettait de la déterminer sans ambiguïté.
 *
 * Ne s'exécute qu'en **complément** : une activité déjà reconnue explicitement dans le texte
 * (ActivityRule) n'est jamais écrasée — le mot présent l'emporte sur le mot déduit. La déduction
 * reste strictement référentielle : aucune correspondance n'est inventée, elle est lue dans la
 * hiérarchie.
 */
@Injectable()
export class ActivityFromSubjectRule implements ClassificationRule {
  readonly name = 'ActivityFromSubjectRule';

  async execute(context: ClassificationContext): Promise<void> {
    if (context.extractedFields.activity) {
      return;
    }
    const detected = context.extractedFields.subjects ?? [];
    if (detected.length === 0) {
      return;
    }

    const familyById = new Map(context.reference.families.map((family) => [family.id, family]));
    const activityById = new Map(
      context.reference.activities.map((activity) => [activity.id, activity]),
    );

    // Une activité par sujet détecté, dédoublonnée : plusieurs sujets d'une même activité
    // (« Magic » et « Pokémon ») ne constituent pas une ambiguïté.
    const candidates = new Map<string, string>();
    for (const name of detected) {
      const subject = context.reference.subjects.find((s) => s.name === name);
      const family = subject ? familyById.get(subject.familyId) : undefined;
      const activity = family ? activityById.get(family.activityId) : undefined;
      if (activity) {
        candidates.set(activity.id, activity.name);
      }
    }
    if (candidates.size === 0) {
      return;
    }

    const [firstName] = candidates.values();
    context.extractedFields.activity = firstName;
    // Déduite, donc moins sûre qu'une activité littéralement présente dans le texte (0,95 / 0,85).
    context.confidenceByField.activity = 0.75;

    if (candidates.size > 1) {
      context.diagnostics.push({
        rule: this.name,
        level: 'WARNING',
        field: 'activity',
        message:
          `Les sujets détectés relèvent de plusieurs activités : ${[...candidates.values()].join(', ')}. ` +
          `« ${firstName} » a été retenue — à confirmer.`,
      });
    } else {
      context.diagnostics.push({
        rule: this.name,
        level: 'INFO',
        field: 'activity',
        message: `Activité « ${firstName} » déduite des sujets détectés (${detected.join(', ')}).`,
      });
    }
  }
}
