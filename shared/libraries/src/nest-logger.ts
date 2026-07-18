import type { LoggerService } from '@nestjs/common';
import { formatLogLine, LogLevel } from './structured-log';

/**
 * Logger structuré (JSON) branché sur NestJS, partagé par le Backend et les Workers (TSPEC.07).
 * Chaque ligne porte timestamp UTC, niveau, composant, contexte et correlationId (repris du
 * contexte de corrélation courant). Le composant est fourni par chaque application.
 */
export class StructuredLogger implements LoggerService {
  constructor(private readonly component: string) {}

  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  error(message: unknown, stackOrContext?: string, context?: string): void {
    this.write('error', message, context ?? stackOrContext, {
      stack: context ? stackOrContext : undefined,
    });
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra: Record<string, unknown> = {},
  ): void {
    const line = formatLogLine({
      level,
      component: this.component,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context,
      ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined)),
    });
    process[level === 'error' ? 'stderr' : 'stdout'].write(`${line}\n`);
  }
}
