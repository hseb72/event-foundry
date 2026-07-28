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
  ActivityFamilyResponseDto,
  CreateActivityFamilyDto,
  UpdateActivityFamilyDto,
} from './activity-family.dto';
import { ActivityFamilyMapper } from './activity-family.mapper';
import { FamiliesService } from './families.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('activity-families')
export class FamiliesController {
  constructor(private readonly service: FamiliesService) {}

  @Get()
  async list(
    @Query('activityId') activityId?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ActivityFamilyResponseDto[]> {
    const families = await this.service.list(activityId, includeInactive === 'true');
    return families.map(ActivityFamilyMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateActivityFamilyDto): Promise<ActivityFamilyResponseDto> {
    return ActivityFamilyMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityFamilyDto,
  ): Promise<ActivityFamilyResponseDto> {
    return ActivityFamilyMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<ActivityFamilyResponseDto> {
    return ActivityFamilyMapper.toResponse(await this.service.deactivate(id));
  }
}
