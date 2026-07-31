import { UrlConnector } from './url.connector';

describe('UrlConnector (capture schema.org JSON-LD — ADR.13)', () => {
  const connector = new UrlConnector();

  const page = (jsonLd: string): string =>
    `<html><head><script type="application/ld+json">${jsonLd}</script></head><body>…</body></html>`;

  it('extrait un événement schema.org d’un bloc JSON-LD', () => {
    const drafts = connector.extract({
      content: page(
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'Tournoi Lorcana',
          startDate: '2026-08-10T18:00:00Z',
          url: 'https://ex.org/e/1',
          location: { '@type': 'Place', name: 'Le Repaire' },
        }),
      ),
      contentType: 'text/html',
    });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].providerKey).toBe('https://ex.org/e/1');
    expect(drafts[0].payload['name']).toBe('Tournoi Lorcana');
  });

  it('parcourt @graph et les sous-types d’Event, ignore le reste', () => {
    const drafts = connector.extract({
      content: page(
        JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', name: 'Boutique' },
            { '@type': 'MusicEvent', name: 'Concert', startDate: '2026-09-01' },
            { '@type': ['Thing', 'Festival'], name: 'Festival', startDate: '2026-09-02' },
          ],
        }),
      ),
    });
    expect(drafts.map((d) => d.payload['name'])).toEqual(['Concert', 'Festival']);
  });

  it('ignore un bloc JSON-LD malformé sans planter (isolation — RG-IMP-07)', () => {
    const drafts = connector.extract({ content: page('{not json') });
    expect(drafts).toEqual([]);
  });

  it('renvoie [] sur une page sans balisage structuré', () => {
    expect(connector.extract({ content: '<html><body>rien</body></html>' })).toEqual([]);
  });
});
