import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

/**
 * Mesure chaque requête HTTP (compteur + durée). Le label `route` utilise le chemin de route
 * matché (et non l'URL brute) pour éviter l'explosion de cardinalité.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { route?: { path?: string } }>();
    const res = http.getResponse<Response>();
    const start = process.hrtime.bigint();

    const record = (): void => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route?.path ?? 'unmatched';
      this.metrics.observe(req.method, route, res.statusCode, seconds);
    };

    return next.handle().pipe(tap({ next: record, error: record }));
  }
}
