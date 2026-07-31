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
import { CountryResponseDto, CreateCountryDto, UpdateCountryDto } from './country.dto';
import { CountryMapper } from './country.mapper';
import { CountriesService } from './countries.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<CountryResponseDto[]> {
    const countries = await this.service.list(includeInactive === 'true');
    return countries.map(CountryMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateCountryDto): Promise<CountryResponseDto> {
    return CountryMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return CountryMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<CountryResponseDto> {
    return CountryMapper.toResponse(await this.service.deactivate(id));
  }
}
