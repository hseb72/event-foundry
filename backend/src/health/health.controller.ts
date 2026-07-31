import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness : le process répond. Ne dépend d'aucune ressource externe. */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness : dépendances critiques joignables. 503 si l'une est indisponible. */
  @Public()
  @Get('ready')
  async readiness(@Res() res: Response): Promise<void> {
    const report = await this.health.readiness();
    res.status(report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(report);
  }
}
