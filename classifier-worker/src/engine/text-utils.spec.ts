import { containsWord, normalize } from './text-utils';

const match = (text: string, needle: string): boolean => containsWord(normalize(text), needle);

describe('normalize', () => {
  it('aplatit les retours à la ligne de l’OCR', () => {
    expect(normalize('Jeu de\nplateau')).toBe('jeu de plateau');
  });

  it('supprime les accents et la casse', () => {
    expect(normalize('Pokémon TCG')).toBe('pokemon tcg');
  });
});

describe('containsWord', () => {
  it('reconnaît un libellé coupé en fin de ligne par l’OCR', () => {
    // Cas le plus fréquent sur une affiche : le libellé du référentiel tient sur deux lignes.
    expect(match('Soirée Jeu de\nplateau au bar', 'Jeu de plateau')).toBe(true);
  });

  it('reconnaît un libellé au pluriel', () => {
    expect(match('Grand tournoi du samedi', 'Tournoi')).toBe(true);
    expect(match('Deux tournois ce week-end', 'Tournoi')).toBe(true);
    expect(match('Soirée jeux de plateau', 'Jeu de plateau')).toBe(true);
  });

  it('tolère une ponctuation différente entre les mots', () => {
    expect(match('Tournoi Yu Gi Oh dimanche', 'Yu-Gi-Oh!')).toBe(true);
    expect(match('Concert rap / hip hop', 'Rap/Hip-hop')).toBe(true);
  });

  it('reconnaît un libellé accentué écrit sans accent', () => {
    expect(match('Tournoi Pokemon', 'Pokémon')).toBe(true);
  });

  it('exige un mot entier : aucune correspondance sur un fragment', () => {
    expect(match('Magicien de scène', 'Magic')).toBe(false);
    expect(match('Tournoiement', 'Tournoi')).toBe(false);
  });

  it('exige un séparateur entre les fragments : « hiphop » n’est pas « hip-hop »', () => {
    expect(match('soirée hiphop', 'Hip-hop')).toBe(false);
  });

  it('exige l’ordre des mots', () => {
    expect(match('plateau de jeu', 'Jeu de plateau')).toBe(false);
  });

  it('ignore un libellé vide', () => {
    expect(match('texte', '   ')).toBe(false);
  });
});
