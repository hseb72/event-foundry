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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CreateStructuredImportDto } from '../dto/create-structured-import.dto';
import { CreateTextImportDto } from '../dto/create-text-import.dto';
import { CreateUrlImportDto } from '../dto/create-url-import.dto';
import { ImportDetailResponseDto, ImportResponseDto } from '../dto/import-response.dto';
import { DEFAULT_MAX_UPLOAD_BYTES } from '../imports.constants';
import { ImportMapper } from '../mappers/import.mapper';
import { AiExtractionImportService } from '../services/ai-extraction-import.service';
import { ImportReplayService } from '../services/import-replay.service';
import { ImportsService } from '../services/imports.service';
import { StructuredImportService } from '../services/structured-import.service';
import { UrlImportService } from '../services/url-import.service';

const MAX_PAGE_SIZE = 100;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

/**
 * Organisation d'attribution durable d'un import (origine — cf. FSPEC.22). L'import n'est rattaché à
 * l'organisation active que si l'utilisateur importe **dans l'expérience Organizer** ; en Explorer
 * (ou toute autre expérience), il reste personnel (`null`). Ainsi tous les agents d'une organisation
 * partagent la même vue sur les soumissions de l'organisation, sans capturer par erreur un import
 * personnel réalisé par un membre de cette organisation.
 */
function importOrganizationId(user: AuthenticatedUser): string | null {
  return user.activeExperience === 'ORGANIZER' ? user.activeOrganizationId : null;
}

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(
    private readonly service: ImportsService,
    private readonly structured: StructuredImportService,
    private readonly urlImport: UrlImportService,
    private readonly aiExtraction: AiExtractionImportService,
    private readonly replay: ImportReplayService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: DEFAULT_MAX_UPLOAD_BYTES } }))
  async importFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ « file »).');
    }
    return ImportMapper.toResponse(
      await this.service.importFile(file, { userId: user.userId, organizationId: importOrganizationId(user) }),
    );
  }

  @Post('text')
  async importText(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTextImportDto,
  ): Promise<ImportResponseDto> {
    return ImportMapper.toResponse(
      await this.service.importText(dto.text, user.userId, importOrganizationId(user)),
    );
  }

  /**
   * Extraction **assistée par IA** d'un document texte (ADR.16 §Frontière) : un seul appel IA remplit
   * un Raw Event structuré (libellés bruts) ; le pipeline commun décide de façon déterministe. Repose
   * sur l'IA configurée pour le cas d'usage « DOC_UNDERSTANDING ».
   */
  @Post('ai-extract')
  async importAiExtract(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTextImportDto,
  ): Promise<ImportResponseDto> {
    return ImportMapper.toResponse(
      await this.aiExtraction.import(dto.text, {
        userId: user.userId,
        organizationId: importOrganizationId(user),
      }),
    );
  }

  /**
   * Extraction **assistée par IA d'une image** (affiche / photo — vision, ADR.16 §Frontière) : un seul
   * appel IA vision remplit un Raw Event structuré ; le pipeline commun décide de façon déterministe.
   */
  @Post('ai-extract-file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: DEFAULT_MAX_UPLOAD_BYTES } }))
  async importAiExtractFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Fichier manquant (champ « file »).');
    }
    return ImportMapper.toResponse(
      await this.aiExtraction.importFile(file, {
        userId: user.userId,
        organizationId: importOrganizationId(user),
      }),
    );
  }

  /**
   * Import structuré déterministe (CSV / JSON — ADR.13/14) par copier-coller. Aucun OCR ni IA :
   * parsing d'un schéma documenté → Raw Events → pipeline → EventCandidates (validation humaine).
   */
  @Post('structured')
  async importStructured(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStructuredImportDto,
  ): Promise<ImportResponseDto> {
    const contentType = dto.format === 'json' ? 'application/json' : dto.format === 'csv' ? 'text/csv' : null;
    return ImportMapper.toResponse(
      await this.structured.import(dto.content, contentType, user.userId, importOrganizationId(user)),
    );
  }

  /**
   * Import par **URL** (ADR.13 §Capture) : capture d'une page et extraction déterministe des
   * événements balisés schema.org (JSON-LD) → pipeline → EventCandidates (validation humaine).
   */
  @Post('url')
  async importUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUrlImportDto,
  ): Promise<ImportResponseDto> {
    return ImportMapper.toResponse(
      await this.urlImport.import(dto.url, user.userId, importOrganizationId(user)),
    );
  }

  /** Mes soumissions (FSPEC.22 §6) : la liste des imports créés par l'utilisateur courant. */
  @Get('mine')
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ImportResponseDto[]> {
    const jobs = await this.service.listForUser(
      user.userId,
      parseIntOrDefault(skip, 0),
      Math.min(parseIntOrDefault(take, 20) || 20, MAX_PAGE_SIZE),
    );
    return jobs.map(ImportMapper.toResponse);
  }

  /**
   * Soumissions **en cours d'analyse de l'organisation active** (FSPEC.22 — vue partagée d'équipe).
   * Tous les agents de l'organisation voient les mêmes soumissions, avec le pseudo de l'auteur, pour
   * savoir s'il est opportun d'agir sur celle d'un collègue. Vide hors expérience Organizer.
   */
  @Get('organization')
  @RequirePermissions('import.create')
  async listOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ImportResponseDto[]> {
    const organizationId = importOrganizationId(user);
    if (!organizationId) {
      return [];
    }
    const jobs = await this.service.listInAnalysisForOrganization(
      organizationId,
      parseIntOrDefault(skip, 0),
      Math.min(parseIntOrDefault(take, 50) || 50, MAX_PAGE_SIZE),
    );
    return jobs.map(ImportMapper.toResponseWithCreator);
  }

  /** Détail d'une de mes soumissions (FSPEC.22 §6) : restreint à son auteur. */
  @Get('mine/:id')
  async detailMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImportDetailResponseDto> {
    return ImportMapper.toDetail(await this.service.getDetailForUserOrThrow(id, user.userId));
  }

  /**
   * Rejeu d'un import (RG-IMP-03) : ré-exécute Validate→Persist depuis les Raw Events conservés,
   * sans re-solliciter le fournisseur. Réservé aux opérateurs du pipeline.
   */
  @Post(':id/replay')
  @RequirePermissions('pipeline.manage')
  replayImport(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ importJobId: string; rawEventCount: number }> {
    return this.replay.replay(id);
  }

  /** Administration : liste globale des imports (réservé ADMIN, pas de scope utilisateur). */
  @Get()
  @RequirePermissions('pipeline.manage')
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
  @RequirePermissions('pipeline.manage')
  async detail(@Param('id', ParseUUIDPipe) id: string): Promise<ImportDetailResponseDto> {
    return ImportMapper.toDetail(await this.service.getDetailOrThrow(id));
  }
}
