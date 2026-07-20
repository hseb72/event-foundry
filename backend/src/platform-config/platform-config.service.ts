import { Inject, Injectable } from '@nestjs/common';
import { Prisma, SecretScope, SecretStatus, SecretType } from '@prisma/client';
import {
  SECRETS_PROVIDER,
  type SecretsProvider,
} from '../secrets/ports/secrets-provider';
import { MailConfigDto, UpdateMailConfigDto } from './dto/platform-config.dto';
import { PlatformConfigRepository } from './platform-config.repository';

const MAIL_SECTION = 'MAIL';
const MAIL_KEY = 'smtp';

interface MailValue {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username: string | null;
}

/**
 * Configuration plateforme Operator (FSPEC.09 / TSPEC.09). Les valeurs non secrètes vivent en base ;
 * les identifiants SMTP sont des **secrets** (ADR.21), jamais renvoyés en clair. Le test d'envoi est
 * un **bouchon** (vérifie la présence/résolution des identifiants) ; un vrai envoi le remplacera.
 */
@Injectable()
export class PlatformConfigService {
  constructor(
    private readonly repository: PlatformConfigRepository,
    @Inject(SECRETS_PROVIDER) private readonly secrets: SecretsProvider,
  ) {}

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

  /** Test d'envoi (BOUCHON) : hôte renseigné + identifiants résolvables → TESTED, sinon FAILED. */
  async testMail(): Promise<{ status: SecretStatus }> {
    const setting = await this.repository.find(MAIL_SECTION, MAIL_KEY);
    let ok = false;
    if (setting) {
      const value = setting.value as unknown as MailValue;
      ok = Boolean(value.host);
      if (ok && setting.secretRef) {
        try {
          const password = await this.secrets.resolve(setting.secretRef);
          ok = password.trim().length > 0;
        } catch {
          ok = false;
        }
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
