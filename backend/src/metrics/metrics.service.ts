import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

/**
 * Métriques Prometheus du Backend (TSPEC.07) : métriques process par défaut + compteur et
 * durées des requêtes HTTP. Le registre est isolé (pas de registre global partagé).
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Nombre de requêtes HTTP traitées.',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.registry],
  });

  readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Durée des requêtes HTTP (secondes).',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  observe(method: string, route: string, status: number, seconds: number): void {
    const labels = { method, route, status: String(status) };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, seconds);
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
