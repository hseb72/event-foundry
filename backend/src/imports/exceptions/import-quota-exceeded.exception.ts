import { HttpException, HttpStatus } from '@nestjs/common';

/** Plafond quotidien d'imports atteint (throttling → HTTP 429, TSPEC.07). */
export class ImportQuotaExceededException extends HttpException {
  constructor(limit: number) {
    super(
      `Plafond quotidien d'imports atteint (${limit}). Réessayez demain ou contactez un administrateur.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
