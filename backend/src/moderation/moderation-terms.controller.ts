import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ModerationTerm } from '@prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateModerationTermDto, UpdateModerationTermDto } from './dto/moderation-term.dto';
import { ModerationTermsService } from './moderation-terms.service';

/**
 * Référentiel des termes de modération (FSPEC.22 §13 / FSPEC.20). CRUD réservé aux Operators
 * (`case.manage`). Ce référentiel est l'unique source des contrôles automatiques de contenu :
 * aucune liste métier n'est codée en dur (règle d'or n°1).
 */
@ApiTags('moderation-terms')
@ApiBearerAuth()
@Controller('moderation/terms')
@RequirePermissions('case.manage')
export class ModerationTermsController {
  constructor(private readonly service: ModerationTermsService) {}

  @Get()
  list(): Promise<ModerationTerm[]> {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateModerationTermDto): Promise<ModerationTerm> {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModerationTermDto,
  ): Promise<ModerationTerm> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.service.delete(id);
  }
}
