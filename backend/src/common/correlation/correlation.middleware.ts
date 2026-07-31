import { Injectable, NestMiddleware } from '@nestjs/common';
import { getCorrelationId, runWithCorrelationId } from '@event-foundry/libraries';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Établit le contexte de corrélation de chaque requête HTTP (TSPEC.07) : reprend l'en-tête
 * `x-correlation-id` s'il est fourni, sinon en génère un, l'expose dans la réponse, et
 * exécute la suite du traitement dans ce contexte (propagé aux logs et aux Jobs publiés).
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[CORRELATION_HEADER];
    const provided = Array.isArray(incoming) ? incoming[0] : incoming;
    runWithCorrelationId(provided, () => {
      res.setHeader(CORRELATION_HEADER, getCorrelationId() ?? '');
      next();
    });
  }
}
