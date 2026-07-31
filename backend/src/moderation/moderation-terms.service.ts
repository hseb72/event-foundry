import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModerationTermKind, type ModerationTerm } from '@prisma/client';
import { ModerationTermsRepository } from './moderation-terms.repository';

/** Résultat d'un contrôle de contenu : le terme fautif détecté et sa nature. */
export interface ModerationTermMatch {
  term: string;
  kind: ModerationTermKind;
}

/** Normalise un texte pour une comparaison déterministe (minuscules, sans diacritiques). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Référentiel des termes de modération (FSPEC.22 §13 / FSPEC.20). Fournit le CRUD (Operators) et le
 * **contrôle déterministe** de contenu : un terme actif présent dans un texte (comparaison normalisée,
 * sur des frontières de mots) constitue une anomalie. Aucune liste métier n'est codée en dur — la
 * seule source est ce référentiel (règle d'or n°1).
 */
@Injectable()
export class ModerationTermsService {
  constructor(private readonly repository: ModerationTermsRepository) {}

  list(): Promise<ModerationTerm[]> {
    return this.repository.list();
  }

  async create(input: { term: string; kind?: ModerationTermKind; isActive?: boolean }): Promise<ModerationTerm> {
    const term = input.term?.trim();
    if (!term) {
      throw new BadRequestException('Le terme ne peut pas être vide.');
    }
    return this.repository.create({
      term,
      kind: input.kind ?? ModerationTermKind.BANNED,
      isActive: input.isActive ?? true,
    });
  }

  update(
    id: string,
    input: Partial<{ term: string; kind: ModerationTermKind; isActive: boolean }>,
  ): Promise<ModerationTerm> {
    return this.repository.update(id, {
      ...(input.term !== undefined ? { term: input.term.trim() } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  async delete(id: string): Promise<void> {
    if ((await this.repository.delete(id)) === 0) {
      throw new NotFoundException(`Terme de modération introuvable : ${id}.`);
    }
  }

  /**
   * Premier terme actif détecté dans le texte (BANNED prioritaire sur SPAM), ou `null`. Détection
   * déterministe : comparaison normalisée, ancrée sur des frontières de mots (évite les
   * correspondances partielles à l'intérieur d'un mot).
   */
  async firstMatch(text: string): Promise<ModerationTermMatch | null> {
    const haystack = normalize(text);
    if (!haystack.trim()) {
      return null;
    }
    const terms = await this.repository.listActive();
    // BANNED d'abord (priorité de traitement), puis SPAM.
    const ordered = [...terms].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === ModerationTermKind.BANNED ? -1 : 1));
    for (const entry of ordered) {
      const needle = normalize(entry.term).trim();
      if (needle && this.containsWord(haystack, needle)) {
        return { term: entry.term, kind: entry.kind };
      }
    }
    return null;
  }

  /** Vrai si `needle` apparaît dans `haystack` sur des frontières non alphanumériques (déterministe). */
  private containsWord(haystack: string, needle: string): boolean {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'u').test(haystack);
  }
}
