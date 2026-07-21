import { AiTextClient } from '../../ai/ai-text-client';
import { AiExtractionConnector } from './ai-extraction.connector';

describe('AiExtractionConnector (extraction IA → Raw Event — ADR.16 §Frontière)', () => {
  let aiTextClient: jest.Mocked<Pick<AiTextClient, 'run'>>;
  let connector: AiExtractionConnector;
  const assistant = { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk' };

  beforeEach(() => {
    aiTextClient = { run: jest.fn() };
    connector = new AiExtractionConnector(aiTextClient as unknown as AiTextClient);
  });

  it('sans IA (assistant absent) : aucun appel, aucun événement', async () => {
    const drafts = await connector.extract({ content: 'Tournoi demain' });
    expect(drafts).toEqual([]);
    expect(aiTextClient.run).not.toHaveBeenCalled();
  });

  it('produit des Raw Events à partir des libellés bruts renvoyés par l’IA', async () => {
    aiTextClient.run.mockResolvedValue(
      JSON.stringify([
        { title: 'Tournoi Magic', starts_at: '2026-08-01T18:00', activity: 'Magic', url: 'https://ex/1' },
      ]),
    );
    const drafts = await connector.extract({ content: 'Annonce…', assistant });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].payload).toMatchObject({ title: 'Tournoi Magic', activity: 'Magic' });
    expect(drafts[0].providerKey).toBe('https://ex/1');
  });

  it('tolère les balises Markdown et le texte autour du JSON', async () => {
    aiTextClient.run.mockResolvedValue('Voici :\n```json\n[{"title":"Expo","starts_at":"2026-09-01"}]\n```');
    const drafts = await connector.extract({ content: 'x', assistant });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].payload['title']).toBe('Expo');
    expect(drafts[0].providerKey).toBeNull();
  });

  it('réponse IA non JSON : aucun événement (jamais d’invention)', async () => {
    aiTextClient.run.mockResolvedValue('Je ne peux pas.');
    const drafts = await connector.extract({ content: 'x', assistant });
    expect(drafts).toEqual([]);
  });
});
