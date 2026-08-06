import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';
import { matchAll } from '../engine/reference-match';

/**
 * Reconnaît les **Sujets** (Axe A — DATA.01 v2.0) présents dans le texte : le jeu, le genre, la
 * discipline (Magic, Pokémon, Rock, Football…), par nom **ou par alias** (« MTG », « D&D »).
 * Cardinalité 0..N : toutes les correspondances sont retenues, dédoublonnées — un texte citant
 * « Magic » et « MTG » ne fait pas remonter deux fois le même sujet. Indépendant de l'activité
 * détectée : c'est au contraire le sujet qui permet de la déduire.
 */
@Injectable()
export class SubjectRule implements ClassificationRule {
  readonly name = 'SubjectRule';

  async execute(context: ClassificationContext): Promise<void> {
    const matches = matchAll(context.normalizedText, context.reference.subjects);
    if (matches.length === 0) {
      return;
    }
    const seen = new Set<string>();
    const names: string[] = [];
    let onlyAliases = true;
    for (const match of matches) {
      if (seen.has(match.entry.id)) {
        continue;
      }
      seen.add(match.entry.id);
      names.push(match.entry.name);
      if (match.kind === 'NAME') {
        onlyAliases = false;
      }
    }
    context.extractedFields.subjects = names;
    // Un sujet reconnu uniquement par abréviation est moins sûr qu'un sujet nommé explicitement.
    context.confidenceByField.subjects = onlyAliases ? 0.75 : 0.85;
  }
}
