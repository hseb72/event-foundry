import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../users/constants/role.constants';
import { CreateTextImportDto } from '../dto/create-text-import.dto';
import { ImportDetailResponseDto, ImportResponseDto } from '../dto/import-response.dto';
import { DEFAULT_MAX_UPLOAD_BYTES } from '../imports.constants';
import { ImportMapper } from '../mappers/import.mapper';
import { ImportsService } from '../services/imports.service';

const MAX_PAGE_SIZE = 100;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: DEFAULT_MAX_UPLOAD_BYTES } }))
  async importFile(@UploadedFile() file?: Express.Multer.File): Promise<ImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ « file »).');
    }
    return ImportMapper.toResponse(await this.service.importFile(file));
  }

  @Post('text')
  async importText(@Body() dto: CreateTextImportDto): Promise<ImportResponseDto> {
    return ImportMapper.toResponse(await this.service.importText(dto.text));
  }

  /** Administration : liste globale des imports (réservé ADMIN, pas de scope utilisateur). */
  @Get()
  @Roles(SystemRole.ADMIN)
  async list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ImportResponseDto[]> {
    const jobs = await this.service.list(
      parseIntOrDefault(skip, 0),
      Math.min(parseIntOrDefault(take, 20) || 20, MAX_PAGE_SIZE),
    );
    return jobs.map(ImportMapper.toResponse);
  }

  @Get(':id')
  @Roles(SystemRole.ADMIN)
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<ImportDetailResponseDto> {
    return ImportMapper.toDetail(await this.service.getDetailOrThrow(id));
  }
}
