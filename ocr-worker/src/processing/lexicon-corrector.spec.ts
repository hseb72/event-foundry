import { correctWithLexicon } from './lexicon-corrector';

const LEXICON = ['Boutique', 'Magic', 'Lorcana', 'Lyon', 'Standard'];

describe('correctWithLexicon', () => {
  it('rapproche un mot océrisé proche (distance 1) et conserve la casse', () => {
    const upper = correctWithLexicon('SALLE BOUTIOUE', LEXICON); // O au lieu de Q
    expect(upper.text).toBe('SALLE BOUTIQUE');
    expect(upper.corrections).toBe(1);

    const title = correctWithLexicon('Tournoi Boufique', LEXICON); // f au lieu de t
    expect(title.text).toBe('Tournoi Boutique');
  });

  it('laisse intacts les mots déjà corrects et inconnus', () => {
    const res = correctWithLexicon('Magic à Lyon avec Xylophone', LEXICON);
    expect(res.text).toBe('Magic à Lyon avec Xylophone');
    expect(res.corrections).toBe(0);
  });

  it('ne touche pas aux tokens trop courts', () => {
    // « Lyn » (3 lettres) proche de « Lyon » mais sous le seuil de longueur.
    const res = correctWithLexicon('Lyn', LEXICON);
    expect(res.text).toBe('Lyn');
    expect(res.corrections).toBe(0);
  });

  it('ne corrige pas en cas d’ambiguïté', () => {
    const res = correctWithLexicon('Carx', ['Cart', 'Card']);
    expect(res.text).toBe('Carx');
    expect(res.corrections).toBe(0);
  });

  it('renvoie le texte inchangé sans lexique', () => {
    expect(correctWithLexicon('Boutiqu', []).corrections).toBe(0);
  });
});
