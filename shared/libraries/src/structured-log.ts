import { getCorrelationId } from './correlation-context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  level: LogLevel;
  /** Composant émetteur (ex. "backend", "ocr-worker"). */
  component: string;
  message: string;
  /** Contexte technique (ex. classe NestJS). */
  context?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Formate une entrée de log structurée en JSON sur une ligne (TSPEC.07) : timestamp UTC,
 * niveau, composant, contexte, correlationId. Le correlationId est repris du contexte de
 * corrélation courant s'il n'est pas fourni explicitement.
 */
export function formatLogLine(fields: LogFields): string {
  const { level, component, message, context, correlationId, ...rest } = fields;
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    component,
    ...(context ? { context } : {}),
    correlationId: correlationId ?? getCorrelationId() ?? null,
    message,
    ...rest,
  };
  return JSON.stringify(entry);
}
