import { CsvJsonConnector } from './csv-json.connector';

describe('CsvJsonConnector (canal structuré déterministe — ADR.13)', () => {
  const connector = new CsvJsonConnector();

  it('parse un CSV avec en-têtes, guillemets et virgules échappées', () => {
    const csv = [
      'key,title,starts_at,venue',
      't1,"Tournoi Magic, édition 1",2026-08-01T18:00:00Z,"Le Repaire, Lyon"',
      't2,Draft Pokémon,2026-08-02T14:00:00Z,Boutique',
    ].join('\n');

    const drafts = connector.extract({ content: csv, contentType: 'text/csv' });

    expect(drafts).toHaveLength(2);
    expect(drafts[0].providerKey).toBe('t1');
    expect(drafts[0].payload).toEqual({
      key: 't1',
      title: 'Tournoi Magic, édition 1',
      starts_at: '2026-08-01T18:00:00Z',
      venue: 'Le Repaire, Lyon',
    });
    expect(drafts[1].providerKey).toBe('t2');
  });

  it('parse un tableau JSON et lit la clé native (id)', () => {
    const json = JSON.stringify([
      { id: 'x1', title: 'Expo', startsAt: '2026-09-01T10:00:00Z' },
      { title: 'Sans clé', startsAt: '2026-09-02T10:00:00Z' },
    ]);

    const drafts = connector.extract({ content: json, contentType: 'application/json' });

    expect(drafts).toHaveLength(2);
    expect(drafts[0].providerKey).toBe('x1');
    expect(drafts[1].providerKey).toBeNull();
  });

  it('ignore les lignes vides et renvoie [] sur contenu vide', () => {
    expect(connector.extract({ content: '   ' })).toEqual([]);
    const csv = 'title,starts_at\n\nExpo,2026-09-01T10:00:00Z\n';
    expect(connector.extract({ content: csv, contentType: 'text/csv' })).toHaveLength(1);
  });

  it('lève une erreur explicite sur JSON invalide', () => {
    expect(() => connector.extract({ content: '[{bad', contentType: 'application/json' })).toThrow(
      /JSON invalide/,
    );
  });
});
