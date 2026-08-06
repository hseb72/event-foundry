import type { Alias, Prisma } from '@prisma/client';

/**
 * Référentiels pouvant porter un alias (DATA.01 v2.0).
 *
 * Aligné sur les référentiels proposables (`REFERENCE_KINDS`, FSPEC.21) : ce qu'un utilisateur peut
 * proposer d'ajouter, la modération doit pouvoir le rattacher comme alias d'une entrée existante.
 */
export const ALIAS_TARGETS = ['ACTIVITY', 'EVENT_TYPE', 'SUBJECT', 'ORGANIZER', 'VENUE'] as const;
export type AliasTarget = (typeof ALIAS_TARGETS)[number];

/** Libellés lisibles, pour les messages d'erreur et l'interface. */
export const ALIAS_TARGET_LABELS: Record<AliasTarget, string> = {
  ACTIVITY: 'Activité',
  EVENT_TYPE: "Type d'événement",
  SUBJECT: 'Sujet',
  ORGANIZER: 'Organisateur',
  VENUE: 'Lieu',
};

/** Colonne portant la cible, par référentiel : une seule est renseignée (contrainte SQL). */
const TARGET_COLUMN: Record<AliasTarget, keyof Alias> = {
  ACTIVITY: 'activityId',
  EVENT_TYPE: 'eventTypeId',
  SUBJECT: 'subjectId',
  ORGANIZER: 'organizerId',
  VENUE: 'venueId',
};

export function isAliasTarget(value: string): value is AliasTarget {
  return (ALIAS_TARGETS as readonly string[]).includes(value);
}

/** Clause `where` ciblant les alias d'une entrée de référentiel. */
export function aliasWhere(target: AliasTarget, targetId: string): Prisma.AliasWhereInput {
  return { [TARGET_COLUMN[target]]: targetId };
}

/** Données de création d'un alias sur une entrée de référentiel. */
export function aliasData(
  target: AliasTarget,
  targetId: string,
  value: string,
): Prisma.AliasUncheckedCreateInput {
  return { value, [TARGET_COLUMN[target]]: targetId } as Prisma.AliasUncheckedCreateInput;
}

/** Cible effective d'un alias existant — lue depuis la colonne renseignée. */
export function aliasTargetOf(alias: Alias): { target: AliasTarget; targetId: string } | null {
  for (const target of ALIAS_TARGETS) {
    const id = alias[TARGET_COLUMN[target]];
    if (typeof id === 'string') {
      return { target, targetId: id };
    }
  }
  return null;
}
