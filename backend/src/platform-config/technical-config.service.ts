import { Injectable } from '@nestjs/common';
import { Prisma, SecretStatus } from '@prisma/client';
import {
  DEFAULT_MAX_IMPORTS_PER_DAY,
  DEFAULT_MAX_UPLOAD_BYTES,
} from '../imports/imports.constants';
import { TechnicalConfigDto, UpdateTechnicalConfigDto } from './dto/technical-config.dto';
import { PlatformConfigRepository } from './platform-config.repository';

const TECHNICAL_SECTION = 'TECHNICAL';
const LIMITS_KEY = 'limits';

/** Limites techniques effectives (résolues avec repli sur les valeurs par défaut). */
export interface TechnicalLimits {
  maxUploadBytes: number;
  maxImportsPerDay: number;
}

interface LimitsValue {
  maxUploadBytes: number;
  maxImportsPerDay: number;
}

/**
 * Limites techniques plateforme (OPE-005 §Technique) : taille maximale d'upload et plafond quotidien
 * d'imports. Valeurs non secrètes stockées en PlatformSetting ; repli sur les constantes par défaut
 * quand rien n'est configuré. `maxUploadBytes` ne peut jamais dépasser le plafond dur (Multer).
 */
@Injectable()
export class TechnicalConfigService {
  constructor(private readonly repository: PlatformConfigRepository) {}

  /** Limites effectives (pour l'enforcement — jamais null). */
  async getLimits(): Promise<TechnicalLimits> {
    const setting = await this.repository.find(TECHNICAL_SECTION, LIMITS_KEY);
    const value = (setting?.value as unknown as LimitsValue) ?? null;
    return {
      maxUploadBytes: this.clampUpload(value?.maxUploadBytes ?? DEFAULT_MAX_UPLOAD_BYTES),
      maxImportsPerDay: Math.max(0, value?.maxImportsPerDay ?? DEFAULT_MAX_IMPORTS_PER_DAY),
    };
  }

  /** Vue exposée (limites + plafond dur pour guider l'UI). */
  async get(): Promise<TechnicalConfigDto> {
    const limits = await this.getLimits();
    return { ...limits, hardMaxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES };
  }

  async update(dto: UpdateTechnicalConfigDto): Promise<TechnicalConfigDto> {
    const value: LimitsValue = {
      maxUploadBytes: this.clampUpload(dto.maxUploadBytes),
      maxImportsPerDay: Math.max(0, dto.maxImportsPerDay),
    };
    await this.repository.upsert(TECHNICAL_SECTION, LIMITS_KEY, {
      value: value as unknown as Prisma.InputJsonValue,
      secretRef: null,
      status: SecretStatus.CONFIGURED,
    });
    return this.get();
  }

  private clampUpload(bytes: number): number {
    return Math.min(Math.max(1024, Math.floor(bytes)), DEFAULT_MAX_UPLOAD_BYTES);
  }
}
