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
import { ActivitiesService } from './activities.service';
import { ActivityResponseDto, CreateActivityDto, UpdateActivityDto } from './activity.dto';
import { ActivityMapper } from './activity.mapper';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('domainId') domainId?: string,
  ): Promise<ActivityResponseDto[]> {
    const activities = await this.service.list(includeInactive === 'true', domainId);
    return activities.map(ActivityMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateActivityDto): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.deactivate(id));
  }
}
