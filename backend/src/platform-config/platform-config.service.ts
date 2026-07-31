import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, SecretScope, SecretStatus, SecretType } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import {
  SECRETS_PROVIDER,
  type SecretsProvider,
} from '../secrets/ports/secrets-provider';
import { GeneralInfoDto, MailConfigDto, UpdateGeneralInfoDto, UpdateMailConfigDto } from './dto/platform-config.dto';
import { PlatformConfigRepository } from './platform-config.repository';

const MAIL_SECTION = 'MAIL';
const MAIL_KEY = 'smtp';
const GENERAL_SECTION = 'GENERAL';
const GENERAL_KEY = 'info';

/** Valeurs par défaut de l'identité publique (FSPEC.17 §4) tant qu'aucun Operator ne l'a définie. */
const DEFAULT_GENERAL: GeneralInfoDto = {
  platformName: 'EventFoundry',
  contactEmail: 'contact@eventfoundry.app',
  supportEmail: 'support@eventfoundry.app',
  recruitmentEmail: null,
  publicInfo: null,
};

interface MailValue {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username: string | null;
}

/**
 * Configuration plateforme Operator (FSPEC.09 / TSPEC.09). Les valeurs non secrètes vivent en base ;
 * les identifiants SMTP sont des **secrets** (ADR.21), jamais renvoyés en clair. Le test d'envoi
 * ouvre une vraie connexion SMTP (`verify`) pour valider hôte/port/TLS/authentification.
 */
@Injectable()
export class PlatformConfigService {
  private readonly logger = new Logger(PlatformConfigService.name);

  constructor(
    private readonly repository: PlatformConfigRepository,
    @Inject(SECRETS_PROVIDER) private readonly secrets: SecretsProvider,
  ) {}

  /** Identité publique de la plateforme (FSPEC.17 §4). Repli sur les valeurs par défaut si absente. */
  async getGeneral(): Promise<GeneralInfoDto> {
    const setting = await this.repository.find(GENERAL_SECTION, GENERAL_KEY);
    if (!setting) {
      return { ...DEFAULT_GENERAL };
    }
    return { ...DEFAULT_GENERAL, ...(setting.value as unknown as Partial<GeneralInfoDto>) };
  }

  async updateGeneral(dto: UpdateGeneralInfoDto): Promise<GeneralInfoDto> {
    const value: GeneralInfoDto = {
      platformName: dto.platformName,
      contactEmail: dto.contactEmail,
      supportEmail: dto.supportEmail,
      recruitmentEmail: dto.recruitmentEmail ?? null,
      publicInfo: dto.publicInfo ?? null,
    };
    await this.repository.upsert(GENERAL_SECTION, GENERAL_KEY, {
      value: value as unknown as Prisma.InputJsonValue,
      secretRef: null,
      status: SecretStatus.CONFIGURED,
    });
    return value;
  }

  async getMail(): Promise<MailConfigDto | null> {
    const setting = await this.repository.find(MAIL_SECTION, MAIL_KEY);
    if (!setting) {
      return null;
    }
    const value = setting.value as unknown as MailValue;
    const secret = setting.secretRef ? await this.secrets.describe(setting.secretRef) : null;
    return {
      host: value.host,
      port: value.port,
      secure: value.secure,
      from: value.from,
      username: value.username ?? null,
      passwordMasked: secret ? secret.masked : null,
      status: setting.status,
    };
  }

  async updateMail(dto: UpdateMailConfigDto): Promise<MailConfigDto> {
    const existing = await this.repository.find(MAIL_SECTION, MAIL_KEY);
    let secretRef = existing?.secretRef ?? null;

    if (dto.password && dto.password.trim()) {
      const meta = await this.secrets.put({
        reference: secretRef ?? undefined,
        type: SecretType.SMTP,
        scope: SecretScope.PLATFORM,
        scopeId: null,
        provider: dto.host,
        value: dto.password.trim(),
      });
      secretRef = meta.reference;
    }

    const value: MailValue = {
      host: dto.host,
      port: dto.port,
      secure: dto.secure,
      from: dto.from,
      username: dto.username ?? null,
    };
    await this.repository.upsert(MAIL_SECTION, MAIL_KEY, {
      value: value as unknown as Prisma.InputJsonValue,
      secretRef,
      status: SecretStatus.CONFIGURED,
    });
    return (await this.getMail())!;
  }

  /**
   * Test d'envoi : ouvre une **vraie connexion SMTP** (`transporter.verify`) avec les identifiants
   * configurés. Valide l'hôte, le port, l'appariement TLS et l'authentification → TESTED ; toute
   * erreur (DNS, port, secure, credentials) → FAILED, avec le motif journalisé pour diagnostic.
   */
  async testMail(): Promise<{ status: SecretStatus }> {
    const setting = await this.repository.find(MAIL_SECTION, MAIL_KEY);
    let ok = false;
    if (setting) {
      const value = setting.value as unknown as MailValue;
      try {
        const auth = value.username && setting.secretRef
          ? { user: value.username, pass: await this.secrets.resolve(setting.secretRef) }
          : undefined;
        const transport = nodemailer.createTransport({
          host: value.host,
          port: value.port,
          secure: value.secure,
          auth,
        });
        await transport.verify();
        ok = true;
      } catch (error) {
        ok = false;
        this.logger.warn(
          `Test SMTP échoué (${value.host}:${value.port}, secure=${value.secure}) : ${(error as Error).message}`,
        );
      }
    }
    const status = ok ? SecretStatus.TESTED : SecretStatus.FAILED;
    if (setting) {
      await this.repository.setStatus(MAIL_SECTION, MAIL_KEY, status);
      if (setting.secretRef) {
        await this.secrets.setStatus(setting.secretRef, status);
      }
    }
    return { status };
  }
}
