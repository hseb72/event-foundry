import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PlatformConfigRepository } from '../platform-config/platform-config.repository';
import { SECRETS_PROVIDER, type SecretsProvider } from '../secrets/ports/secrets-provider';

const MAIL_SECTION = 'MAIL';
const MAIL_KEY = 'smtp';

interface MailValue {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username: string | null;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoi d'e-mails transactionnels. Utilise la **configuration mail Operator** (FSPEC.17) : SMTP +
 * secret résolu au point d'usage (ADR.21). Best-effort : une absence de configuration ou une panne
 * SMTP est journalisée mais **n'échoue jamais** l'opération appelante (inscription, récupération…).
 * En l'absence de SMTP configuré, l'e-mail est journalisé (mode dev) plutôt que perdu silencieusement.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly platformConfig: PlatformConfigRepository,
    @Inject(SECRETS_PROVIDER) private readonly secrets: SecretsProvider,
    private readonly config: ConfigService,
  ) {}

  /** Envoie un e-mail. Renvoie `true` si remis au SMTP, `false` si non configuré / en échec. */
  async send(mail: OutgoingMail): Promise<boolean> {
    const setting = await this.platformConfig.find(MAIL_SECTION, MAIL_KEY);
    const value = setting?.value as unknown as MailValue | undefined;
    if (!setting || !value?.host) {
      // Aucun SMTP configuré : on trace le contenu pour le dev, sans bloquer le flux métier.
      this.logger.warn(
        `SMTP non configuré — e-mail non envoyé à ${mail.to} : « ${mail.subject} ». ${this.devHint(mail)}`,
      );
      return false;
    }
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
      const info = await transport.sendMail({
        from: value.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text ?? stripHtml(mail.html),
        html: mail.html,
      });
      // `sendMail` résolu = le serveur SMTP a **accepté** le message (pas une preuve de remise finale).
      // On journalise la réponse serveur et les destinataires acceptés/rejetés pour lever toute
      // ambiguïté (un « accepté » sans réception relève ensuite du serveur : SPF/DKIM, spam, alias `from`).
      const accepted = (info.accepted ?? []).map(String);
      const rejected = (info.rejected ?? []).map(String);
      const delivered = accepted.some((address) => address.toLowerCase() === mail.to.toLowerCase());
      this.logger.log(
        `SMTP ${value.host}:${value.port} (secure=${value.secure}, from=${value.from}) → ` +
          `messageId=${info.messageId} accepted=[${accepted.join(', ')}] rejected=[${rejected.join(', ')}] ` +
          `response="${(info.response ?? '').trim()}"`,
      );
      if (rejected.length > 0 || !delivered) {
        this.logger.warn(
          `E-mail à ${mail.to} non confirmé accepté par le SMTP (rejeté ou hors liste « accepted »). ` +
            `Vérifiez l'expéditeur autorisé (${value.from}), l'appariement port/secure et les règles anti-spam.`,
        );
      }
      return delivered;
    } catch (error) {
      this.logger.error(
        `Envoi e-mail échoué (${mail.to} — « ${mail.subject} » via ${value.host}:${value.port} secure=${value.secure})`,
        error as Error,
      );
      return false;
    }
  }

  /** En dev, la trace inclut le lien pour poursuivre le parcours sans SMTP réel. */
  private devHint(mail: OutgoingMail): string {
    return this.config.get<string>('NODE_ENV') === 'production' ? '' : `Contenu : ${stripHtml(mail.html)}`;
  }
}

/** Rendu texte minimal d'un corps HTML (repli `text` + trace lisible). */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
