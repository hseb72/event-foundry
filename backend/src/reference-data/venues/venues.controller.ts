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
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../users/constants/role.constants';
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
  @Roles(SystemRole.ADMIN)
  async create(@Body() dto: CreateVenueDto): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @Roles(SystemRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueDto,
  ): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<VenueResponseDto> {
    return VenueMapper.toResponse(await this.service.deactivate(id));
  }
}
