import { OcrPostProcessor } from './ocr-post-processor';

describe('OcrPostProcessor', () => {
  const processor = new OcrPostProcessor();

  it('homogénéise les fins de ligne et compacte les espaces', () => {
    expect(processor.process('Ligne  1\r\n\r\n\r\nLigne\t2   ')).toBe('Ligne 1\n\nLigne 2');
  });

  it('supprime les caractères de contrôle en conservant le texte', () => {
    expect(processor.process(`abc${String.fromCharCode(0)}def`)).toBe('abcdef');
  });

  it('préserve la tabulation comme séparateur d\'espace', () => {
    expect(processor.process('a\tb')).toBe('a b');
  });
});
