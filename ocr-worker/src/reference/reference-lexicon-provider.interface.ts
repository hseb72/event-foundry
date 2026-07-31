export const OCR_LEXICON_PROVIDER = 'OCR_LEXICON_PROVIDER';

/**
 * Fournit un lexique de mots issus des référentiels (noms d'activités, types, formats,
 * organisateurs, lieux, villes, alias), pour améliorer la reconnaissance OCR de ces termes.
 *
 * Le worker OCR ne dépend jamais de PostgreSQL (TSPEC.04, ADR.07) : la source concrète
 * (API Backend) est un détail derrière cette abstraction. Aucune liste métier n'est codée en
 * dur — tout provient des référentiels (règle d'or 1).
 */
export interface ReferenceLexiconProvider {
  /** Mots dédupliqués, prêts à alimenter le dictionnaire utilisateur de Tesseract. */
  getWords(): Promise<string[]>;
}
