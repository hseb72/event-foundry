/** Créneau minimal d'une entrée de planning pour la détection de conflits. */
export interface PlanningSlot {
  id: string;
  startsAt: Date;
  endsAt: Date | null;
}

/** Fin effective d'un créneau : `endsAt` si présent, sinon l'instant de début (créneau ponctuel). */
function effectiveEnd(slot: PlanningSlot): number {
  return (slot.endsAt ?? slot.startsAt).getTime();
}

/**
 * Deux créneaux sont en conflit si leurs intervalles [début, fin] se chevauchent, ou s'ils
 * commencent au même instant (doublon d'horaire). Les temps de trajet ne sont pas pris en compte
 * en V2 (TSPEC.03).
 */
export function slotsOverlap(a: PlanningSlot, b: PlanningSlot): boolean {
  const aStart = a.startsAt.getTime();
  const bStart = b.startsAt.getTime();
  if (aStart === bStart) {
    return true;
  }
  return aStart < effectiveEnd(b) && bStart < effectiveEnd(a);
}

/**
 * Détecte les conflits temporels au sein d'un ensemble de créneaux. Renvoie, pour chaque id, la
 * liste des ids en conflit (relation symétrique). Déterministe, sans effet de bord.
 */
export function detectConflicts(slots: PlanningSlot[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const add = (id: string, other: string): void => {
    conflicts.set(id, [...(conflicts.get(id) ?? []), other]);
  };

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (slotsOverlap(slots[i], slots[j])) {
        add(slots[i].id, slots[j].id);
        add(slots[j].id, slots[i].id);
      }
    }
  }
  return conflicts;
}
