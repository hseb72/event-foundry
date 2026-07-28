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
import {
  CreateModalityDimensionDto,
  ModalityDimensionResponseDto,
  UpdateModalityDimensionDto,
} from './modality-dimension.dto';
import { ModalityDimensionMapper } from './modality-dimension.mapper';
import { ModalityDimensionsService } from './modality-dimensions.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('modality-dimensions')
export class ModalityDimensionsController {
  constructor(private readonly service: ModalityDimensionsService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ModalityDimensionResponseDto[]> {
    const dimensions = await this.service.list(includeInactive === 'true');
    return dimensions.map(ModalityDimensionMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateModalityDimensionDto): Promise<ModalityDimensionResponseDto> {
    return ModalityDimensionMapper.toResponseShallow(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModalityDimensionDto,
  ): Promise<ModalityDimensionResponseDto> {
    return ModalityDimensionMapper.toResponseShallow(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ModalityDimensionResponseDto> {
    return ModalityDimensionMapper.toResponseShallow(await this.service.deactivate(id));
  }
}
