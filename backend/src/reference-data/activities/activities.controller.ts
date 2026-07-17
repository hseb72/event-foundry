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
  @Roles(SystemRole.ADMIN)
  async create(@Body() dto: CreateActivityDto): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @Roles(SystemRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ActivityResponseDto> {
    return ActivityMapper.toResponse(await this.service.deactivate(id));
  }
}
