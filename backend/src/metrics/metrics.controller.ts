import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  /** Exposition Prometheus (format texte). Publique : scrapée par le collecteur. */
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  @Header('Cache-Control', 'no-store')
  async scrape(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', this.metrics.contentType());
    res.send(await this.metrics.metrics());
  }
}
