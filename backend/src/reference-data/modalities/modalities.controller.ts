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
import { CreateModalityDto, ModalityResponseDto, UpdateModalityDto } from './modality.dto';
import { ModalityMapper } from './modality.mapper';
import { ModalitiesService } from './modalities.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('modalities')
export class ModalitiesController {
  constructor(private readonly service: ModalitiesService) {}

  @Get()
  async list(
    @Query('dimensionId') dimensionId?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ModalityResponseDto[]> {
    const modalities = await this.service.list(dimensionId, includeInactive === 'true');
    return modalities.map(ModalityMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateModalityDto): Promise<ModalityResponseDto> {
    return ModalityMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModalityDto,
  ): Promise<ModalityResponseDto> {
    return ModalityMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ModalityResponseDto> {
    return ModalityMapper.toResponse(await this.service.deactivate(id));
  }
}
