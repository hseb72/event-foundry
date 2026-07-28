import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { containsWord } from '../engine/text-utils';

/**
 * Reconnaît les **Sujets** (Axe A — DATA.01 v2.0) présents dans le texte : le jeu, le genre, la
 * discipline (Magic, Pokémon, Rock, Football…). Cardinalité 0..N : toutes les correspondances sont
 * retenues. Indépendant de l'activité détectée (un sujet est reconnu par son nom).
 */
@Injectable()
export class SubjectRule implements ClassificationRule {
  readonly name = 'SubjectRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = context.reference.subjects.filter((subject) =>
      containsWord(context.normalizedText, subject.name),
    );
    if (matches.length === 0) {
      return;
    }
    context.extractedFields.subjects = matches.map((subject) => subject.name);
    context.confidenceByField.subjects = 0.85;
  }
}
