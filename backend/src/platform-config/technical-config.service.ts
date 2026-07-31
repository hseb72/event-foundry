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

/** Réglage d'auto-provisioning des référentiels (ADR.24). Opt-out par défaut. */
export interface ProvisioningConfig {
  autoProvisionReferentials: boolean;
  provisioningDefaultDomainId: string | null;
}

interface LimitsValue {
  maxUploadBytes: number;
  maxImportsPerDay: number;
  autoProvisionReferentials?: boolean;
  provisioningDefaultDomainId?: string | null;
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

  /** Réglage d'auto-provisioning effectif (pour le pipeline d'import — ADR.24). Jamais null. */
  async getProvisioning(): Promise<ProvisioningConfig> {
    const setting = await this.repository.find(TECHNICAL_SECTION, LIMITS_KEY);
    const value = (setting?.value as unknown as LimitsValue) ?? null;
    return {
      autoProvisionReferentials: value?.autoProvisionReferentials ?? false,
      provisioningDefaultDomainId: value?.provisioningDefaultDomainId ?? null,
    };
  }

  /** Vue exposée (limites + plafond dur + réglage d'auto-provisioning). */
  async get(): Promise<TechnicalConfigDto> {
    const [limits, provisioning] = await Promise.all([this.getLimits(), this.getProvisioning()]);
    return { ...limits, ...provisioning, hardMaxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES };
  }

  async update(dto: UpdateTechnicalConfigDto): Promise<TechnicalConfigDto> {
    const value: LimitsValue = {
      maxUploadBytes: this.clampUpload(dto.maxUploadBytes),
      maxImportsPerDay: Math.max(0, dto.maxImportsPerDay),
      autoProvisionReferentials: dto.autoProvisionReferentials ?? false,
      provisioningDefaultDomainId: dto.provisioningDefaultDomainId?.trim() || null,
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
