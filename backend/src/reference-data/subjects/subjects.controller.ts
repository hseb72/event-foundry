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
import { CreateSubjectDto, SubjectResponseDto, UpdateSubjectDto } from './subject.dto';
import { SubjectMapper } from './subject.mapper';
import { SubjectsService } from './subjects.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  async list(
    @Query('familyId') familyId?: string,
    @Query('activityId') activityId?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<SubjectResponseDto[]> {
    const subjects = await this.service.list({
      familyId,
      activityId,
      includeInactive: includeInactive === 'true',
    });
    return subjects.map(SubjectMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    return SubjectMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return SubjectMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<SubjectResponseDto> {
    return SubjectMapper.toResponse(await this.service.deactivate(id));
  }
}
