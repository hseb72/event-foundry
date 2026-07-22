import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';

/** Un type de lien de compte : chemin front + libellés du message. */
interface LinkKind {
  path: string;
  subject: string;
  intro: string;
  cta: string;
}

const KINDS: Record<string, LinkKind> = {
  'verify-email': {
    path: 'verify-email',
    subject: 'Confirmez votre adresse e-mail',
    intro: 'Bienvenue sur EventFoundry ! Confirmez votre adresse pour activer votre compte.',
    cta: 'Confirmer mon adresse',
  },
  'reset-password': {
    path: 'reset-password',
    subject: 'Réinitialisation de votre mot de passe',
    intro: 'Vous avez demandé à réinitialiser votre mot de passe. Ce lien expire dans 1 heure.',
    cta: 'Choisir un nouveau mot de passe',
  },
  'confirm-email-change': {
    path: 'confirm-email-change',
    subject: 'Confirmez votre nouvelle adresse e-mail',
    intro: 'Confirmez cette adresse pour qu’elle devienne votre identifiant de connexion.',
    cta: 'Confirmer la nouvelle adresse',
  },
};

/**
 * Remise des liens de compte (vérification, récupération, changement d'e-mail) au destinataire.
 * Compose un e-mail lisible et délègue l'envoi à `MailService` (SMTP Operator, best-effort — sans
 * SMTP configuré, le lien est tracé en dev). Ne bloque jamais l'appelant.
 */
@Injectable()
export class AccountLinkMailer {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async deliver(email: string, kind: keyof typeof KINDS | string, rawToken: string): Promise<void> {
    const template = KINDS[kind] ?? {
      path: kind,
      subject: 'EventFoundry',
      intro: 'Suivez ce lien pour poursuivre.',
      cta: 'Continuer',
    };
    const base = this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:4200');
    const url = `${base}/${template.path}?token=${rawToken}`;
    await this.mail.send({
      to: email,
      subject: template.subject,
      html:
        `<p>${template.intro}</p>` +
        `<p><a href="${url}">${template.cta}</a></p>` +
        `<p style="color:#888;font-size:12px">Si le bouton ne fonctionne pas, copiez ce lien : ${url}</p>`,
    });
  }
}
