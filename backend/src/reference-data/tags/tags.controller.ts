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
import { CreateTagDto, TagResponseDto, UpdateTagDto } from './tag.dto';
import { TagMapper } from './tag.mapper';
import { TagsService } from './tags.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<TagResponseDto[]> {
    const tags = await this.service.list(includeInactive === 'true');
    return tags.map(TagMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateTagDto): Promise<TagResponseDto> {
    return TagMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return TagMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<TagResponseDto> {
    return TagMapper.toResponse(await this.service.deactivate(id));
  }
}
