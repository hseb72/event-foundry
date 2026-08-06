import { containsWord } from './text-utils';

/** Entrée de référentiel reconnaissable : son nom et ses libellés alternatifs. */
export interface NamedWithAliases {
  name: string;
  aliases: string[];
}

/** Comment une entrée a été reconnue — un alias inspire moins de confiance qu'un nom exact. */
export type MatchKind = 'NAME' | 'ALIAS' | null;

/**
 * Reconnaît une entrée de référentiel par son **nom** ou par l'un de ses **alias**.
 *
 * Les alias portent ce qu'une affiche écrit réellement — « MTG » pour Magic, « D&D » pour Donjons &
 * Dragons, « impro » pour Improvisation. Le nom prime : il est explicite là où un alias est une
 * abréviation, parfois partagée entre plusieurs domaines.
 */
export function matchReference(normalizedText: string, entry: NamedWithAliases): MatchKind {
  if (containsWord(normalizedText, entry.name)) {
    return 'NAME';
  }
  if (entry.aliases.some((alias) => containsWord(normalizedText, alias))) {
    return 'ALIAS';
  }
  return null;
}

/**
 * Toutes les entrées reconnues, **nom d'abord**. Un texte citant « Magic » et « MTG » ne doit pas
 * faire remonter deux fois la même référence : le classement par mode de reconnaissance permet aux
 * règles de privilégier les correspondances exactes sans perdre les autres.
 */
export function matchAll<T extends NamedWithAliases>(
  normalizedText: string,
  entries: T[],
): { entry: T; kind: Exclude<MatchKind, null> }[] {
  const matches: { entry: T; kind: Exclude<MatchKind, null> }[] = [];
  for (const entry of entries) {
    const kind = matchReference(normalizedText, entry);
    if (kind) {
      matches.push({ entry, kind });
    }
  }
  return matches.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'NAME' ? -1 : 1));
}
