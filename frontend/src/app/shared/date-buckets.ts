/**
 * Répartition d'événements en trois sections temporelles **disjointes** (RG-PLN-04, FSPEC.12) :
 * aujourd'hui / le reste de cette semaine / le reste de ce mois. Les éléments au-delà du mois
 * courant sont exclus (bloc « plus tard » traité ailleurs). Calcul dans le fuseau local.
 */
export interface PeriodBuckets<T> {
  today: T[];
  thisWeek: T[];
  thisMonth: T[];
}

/** Fin de journée (23:59:59.999) locale du jour de `d`. */
function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

/** Fin de la semaine courante (dimanche soir), semaine commençant le lundi. */
function endOfWeek(now: Date): Date {
  const day = now.getDay(); // 0=dimanche … 6=samedi
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  return endOfDay(sunday);
}

/** Fin du mois courant (dernier jour, 23:59:59.999). */
function endOfMonth(now: Date): Date {
  return endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

export function bucketByPeriod<T>(items: T[], dateOf: (item: T) => string | Date): PeriodBuckets<T> {
  const now = new Date();
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now);
  const monthEnd = endOfMonth(now);

  const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const buckets: PeriodBuckets<T> = { today: [], thisWeek: [], thisMonth: [] };
  for (const item of items) {
    const at = new Date(dateOf(item));
    if (isSameDay(at, now)) {
      buckets.today.push(item);
    } else if (at <= todayEnd) {
      // Antérieur à aujourd'hui (passé) : exclu des blocs d'accueil (à venir uniquement).
      continue;
    } else if (at <= weekEnd) {
      buckets.thisWeek.push(item);
    } else if (at <= monthEnd) {
      buckets.thisMonth.push(item);
    }
    // au-delà du mois : ignoré pour ces blocs.
  }
  return buckets;
}
