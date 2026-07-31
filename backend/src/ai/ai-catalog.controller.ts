import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { AI_PROVIDERS, type AiProviderKind } from './ai-providers';

/** Fournisseur IA proposé (guidage UI). Ne contient aucun secret. */
export class AiProviderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  kind!: AiProviderKind;

  @ApiProperty({ type: [String], description: 'Modèles suggérés (compatibles vision pour l’OCR).' })
  suggestedModels!: string[];

  @ApiProperty()
  requiresKey!: boolean;

  @ApiProperty({ nullable: true, description: 'Où obtenir la clé API.' })
  keyUrl!: string | null;

  @ApiProperty({ nullable: true })
  keyHint!: string | null;
}

/** Catalogue des fournisseurs IA (guidage : fournisseurs, modèles suggérés, où trouver la clé). */
@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiCatalogController {
  @Get('providers')
  @ApiOkResponse({ type: [AiProviderDto] })
  providers(): AiProviderDto[] {
    return AI_PROVIDERS.map((provider) => ({
      id: provider.id,
      label: provider.label,
      kind: provider.kind,
      suggestedModels: provider.suggestedModels,
      requiresKey: provider.requiresKey,
      keyUrl: provider.keyUrl ?? null,
      keyHint: provider.keyHint ?? null,
    }));
  }
}
