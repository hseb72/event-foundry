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
import { AliasesService } from './aliases.service';
import { AliasResponseDto, CreateAliasDto, UpdateAliasDto } from './alias.dto';
import { AliasMapper } from './alias.mapper';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller()
export class AliasesController {
  constructor(private readonly service: AliasesService) {}

  @Get('activities/:activityId/aliases')
  async listByActivity(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<AliasResponseDto[]> {
    const aliases = await this.service.listByActivity(activityId, includeInactive === 'true');
    return aliases.map(AliasMapper.toResponse);
  }

  @Post('activities/:activityId/aliases')
  @RequirePermissions('reference.manage')
  async create(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: CreateAliasDto,
  ): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.create(activityId, dto));
  }

  @Put('aliases/:id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAliasDto,
  ): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete('aliases/:id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.deactivate(id));
  }
}
