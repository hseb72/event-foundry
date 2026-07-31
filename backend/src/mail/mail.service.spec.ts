import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { PlatformConfigRepository } from '../platform-config/platform-config.repository';
import type { SecretsProvider } from '../secrets/ports/secrets-provider';
import { MailService } from './mail.service';

jest.mock('nodemailer');
const nodemailerMock = nodemailer as jest.Mocked<typeof nodemailer>;

describe('MailService — envoi transactionnel (best-effort, config Operator)', () => {
  let platformConfig: { find: jest.Mock };
  let secrets: { resolve: jest.Mock };
  let config: { get: jest.Mock };
  let service: MailService;
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    platformConfig = { find: jest.fn() };
    secrets = { resolve: jest.fn().mockResolvedValue('smtp-secret') };
    config = { get: jest.fn().mockReturnValue('test') };
    sendMail.mockResolvedValue({
      accepted: ['user@b.c'],
      rejected: [],
      response: '250 2.0.0 OK',
      messageId: 'm-1',
    });
    nodemailerMock.createTransport.mockReturnValue({ sendMail } as never);
    service = new MailService(
      platformConfig as unknown as PlatformConfigRepository,
      secrets as unknown as SecretsProvider,
      config as unknown as ConfigService,
    );
  });

  const mail = { to: 'user@b.c', subject: 'Hello', html: '<p>Bonjour <b>toi</b></p>' };

  it('SMTP non configuré → aucun envoi, aucune exception (renvoie false)', async () => {
    platformConfig.find.mockResolvedValue(null);
    await expect(service.send(mail)).resolves.toBe(false);
    expect(nodemailerMock.createTransport).not.toHaveBeenCalled();
  });

  it('SMTP configuré → envoie via nodemailer avec le secret résolu', async () => {
    platformConfig.find.mockResolvedValue({
      value: { host: 'smtp.x', port: 587, secure: true, from: 'no-reply@x', username: 'u' },
      secretRef: 'ref-1',
    });
    await expect(service.send(mail)).resolves.toBe(true);
    expect(secrets.resolve).toHaveBeenCalledWith('ref-1');
    expect(nodemailerMock.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.x', port: 587, secure: true, auth: { user: 'u', pass: 'smtp-secret' } }),
    );
    const sent = sendMail.mock.calls[0][0];
    expect(sent.to).toBe('user@b.c');
    expect(sent.text).toBe('Bonjour toi'); // repli texte du HTML
  });

  it('destinataire rejeté par le SMTP → renvoie false (non confirmé accepté)', async () => {
    platformConfig.find.mockResolvedValue({
      value: { host: 'smtp.x', port: 587, secure: false, from: 'no-reply@x', username: 'u' },
      secretRef: 'ref-1',
    });
    sendMail.mockResolvedValue({ accepted: [], rejected: ['user@b.c'], response: '550 denied' });
    await expect(service.send(mail)).resolves.toBe(false);
  });

  it('panne SMTP → best-effort : renvoie false sans propager', async () => {
    platformConfig.find.mockResolvedValue({
      value: { host: 'smtp.x', port: 25, secure: false, from: 'f', username: null },
      secretRef: null,
    });
    sendMail.mockRejectedValue(new Error('connection refused'));
    await expect(service.send(mail)).resolves.toBe(false);
  });
});
