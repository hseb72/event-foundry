import { Controller, DefaultValuePipe, Get, ParseFloatPipe, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { EventResponseDto } from '../events/dto/event-response.dto';
import { PublicService } from './public.service';

/**
 * Vitrine publique (page de garde). Accessible **sans authentification** : présente des événements
 * « à la Une » à un visiteur anonyme. La localisation est purement facultative (géolocalisation
 * opt-in du navigateur) et ne sert qu'au tri par proximité — aucune donnée n'est stockée.
 */
@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('featured')
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiOkResponse({ type: [EventResponseDto] })
  featured(
    @Query('take', new DefaultValuePipe(8), ParseIntPipe) take: number,
    @Query('lat', new DefaultValuePipe(null), new ParseFloatPipe({ optional: true })) lat?: number,
    @Query('lng', new DefaultValuePipe(null), new ParseFloatPipe({ optional: true })) lng?: number,
  ): Promise<EventResponseDto[]> {
    const location =
      lat != null && lng != null ? { latitude: lat, longitude: lng } : undefined;
    return this.service.featured(Math.min(Math.max(take, 1), 24), location);
  }
}
