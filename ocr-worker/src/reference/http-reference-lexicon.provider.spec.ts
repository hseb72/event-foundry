import { tokenize } from './http-reference-lexicon.provider';

describe('tokenize (lexique OCR)', () => {
  it('découpe les libellés en mots et déduplique sans tenir compte de la casse', () => {
    const words = tokenize(['Star Wars Unlimited', 'La Boutique du Coin', 'star wars']);
    expect(words).toContain('Star');
    expect(words).toContain('Wars');
    expect(words).toContain('Unlimited');
    expect(words).toContain('Boutique');
    // « star » et « wars » déjà vus (casse ignorée) : pas de doublon.
    expect(words.filter((w) => w.toLowerCase() === 'star')).toHaveLength(1);
    expect(words.filter((w) => w.toLowerCase() === 'wars')).toHaveLength(1);
  });

  it('conserve traits d’union et apostrophes internes, écarte le bruit', () => {
    const words = tokenize(['Avant-première', "Jeu d'aventure", '  ', '- 5 €', 'a']);
    expect(words).toContain('Avant-première');
    expect(words).toContain("d'aventure");
    // « a » (< 2), « 5 » (sans lettre), séparateurs seuls : écartés.
    expect(words).not.toContain('a');
    expect(words).not.toContain('5');
  });

  it('ignore les entrées vides (ex. ville nulle)', () => {
    expect(tokenize(['', '   '])).toEqual([]);
  });
});
