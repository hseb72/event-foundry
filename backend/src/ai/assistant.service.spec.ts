import { SecretScope } from '@prisma/client';
import { AiCallLogService } from './ai-call-log.service';
import { AiConfigService, type ResolvedAssistant } from './ai-config.service';
import { AiTextClient } from './ai-text-client';
import { AssistantService } from './assistant.service';

describe('AssistantService (assistance IA texte — ADR.16)', () => {
  let aiConfig: jest.Mocked<Pick<AiConfigService, 'resolveForUseCase'>>;
  let textClient: jest.Mocked<Pick<AiTextClient, 'run'>>;
  let callLog: jest.Mocked<Pick<AiCallLogService, 'record'>>;
  let service: AssistantService;

  const assistant: ResolvedAssistant = {
    scope: SecretScope.USER,
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: 'sk',
  };

  beforeEach(() => {
    aiConfig = { resolveForUseCase: jest.fn() };
    textClient = { run: jest.fn() };
    callLog = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AssistantService(
      aiConfig as unknown as AiConfigService,
      textClient as unknown as AiTextClient,
      callLog as unknown as AiCallLogService,
    );
  });

  it('repli déterministe (assisted=false) quand aucune IA n’est configurée', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(null);
    const result = await service.assist('u-1', null, 'TRANSLATE', 'Bonjour', 'anglais');
    expect(result).toEqual({ useCase: 'TRANSLATE', assisted: false, text: null, provider: null });
    expect(textClient.run).not.toHaveBeenCalled();
  });

  it('traduit via l’IA et journalise l’appel (SUCCESS)', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(assistant);
    textClient.run.mockResolvedValue('Hello');
    const result = await service.assist('u-1', 'org-1', 'TRANSLATE', 'Bonjour', 'anglais');
    expect(result).toEqual(
      expect.objectContaining({ assisted: true, text: 'Hello', provider: 'openai', useCase: 'TRANSLATE' }),
    );
    expect(aiConfig.resolveForUseCase).toHaveBeenCalledWith('u-1', 'org-1', 'TRANSLATE');
    expect(callLog.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCESS', useCase: 'TRANSLATE' }));
  });

  it('repli déterministe quand le fournisseur échoue (journalisé FAILED)', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(assistant);
    textClient.run.mockRejectedValue(new Error('429'));
    const result = await service.assist('u-1', null, 'SUMMARIZE', 'Un long texte…');
    expect(result.assisted).toBe(false);
    expect(callLog.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
  });

  it('texte vide → assisted=false sans appel IA', async () => {
    const result = await service.assist('u-1', null, 'TRANSLATE', '   ');
    expect(result.assisted).toBe(false);
    expect(aiConfig.resolveForUseCase).not.toHaveBeenCalled();
  });
});
