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
import { CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { CategoryMapper } from './category.mapper';
import { CategoriesService } from './categories.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<CategoryResponseDto[]> {
    const categories = await this.service.list(includeInactive === 'true');
    return categories.map(CategoryMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return CategoryMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return CategoryMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return CategoryMapper.toResponse(await this.service.deactivate(id));
  }
}
