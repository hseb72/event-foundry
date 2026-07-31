export type DatePeriod =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'next-7-days'
  | 'next-30-days';

export interface DateRange {
  startsFrom?: Date;
  startsTo?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * Calcule la plage temporelle d'une recherche (FSPEC.04). Les calculs sont en UTC ; la
 * conversion vers le fuseau utilisateur relève de l'API/Front (TSPEC.07).
 *
 * Priorité : `period` (filtre rapide) > `from`/`to` (période personnalisée) > défaut
 * (événements futurs).
 */
export function computeDateRange(options: {
  period?: DatePeriod;
  from?: string;
  to?: string;
  now?: Date;
}): DateRange {
  const now = options.now ?? new Date();

  switch (options.period) {
    case 'today':
      return { startsFrom: startOfUtcDay(now), startsTo: endOfUtcDay(now) };
    case 'this-week': {
      const mondayOffset = (now.getUTCDay() + 6) % 7;
      const start = new Date(startOfUtcDay(now).getTime() - mondayOffset * DAY_MS);
      const end = endOfUtcDay(new Date(start.getTime() + 6 * DAY_MS));
      return { startsFrom: start, startsTo: end };
    }
    case 'this-month': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const end = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      return { startsFrom: start, startsTo: end };
    }
    case 'next-7-days':
      return { startsFrom: now, startsTo: new Date(now.getTime() + 7 * DAY_MS) };
    case 'next-30-days':
      return { startsFrom: now, startsTo: new Date(now.getTime() + 30 * DAY_MS) };
    default:
      break;
  }

  if (options.from || options.to) {
    return {
      startsFrom: options.from ? new Date(options.from) : undefined,
      startsTo: options.to ? new Date(options.to) : undefined,
    };
  }

  // Par défaut : événements à venir.
  return { startsFrom: now };
}
