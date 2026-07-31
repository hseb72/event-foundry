import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CreateVenueDto, UpdateVenueDto, VenueResponseDto } from './venue.dto';
import { VenueMapper } from './venue.mapper';
import { VenuesService } from './venues.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('venues')
export class VenuesController {
  constructor(private readonly service: VenuesService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<VenueResponseDto[]> {
    const venues = await this.service.list(includeInactive === 'true');
    return venues.map(VenueMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateVenueDto): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueDto,
  ): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.deactivate(id));
  }
}
