import { extractZipEntry, parseRows, readTsv } from './geonames.util';

/** Construit une archive ZIP minimale « stored » (méthode 0) contenant une seule entrée. */
function buildStoredZip(name: string, content: string): Buffer {
  const nameBuf = Buffer.from(name, 'utf8');
  const data = Buffer.from(content, 'utf8');

  const local = Buffer.alloc(30 + nameBuf.length + data.length);
  local.writeUInt32LE(0x04034b50, 0); // signature
  local.writeUInt16LE(0, 8); // method = stored
  local.writeUInt32LE(data.length, 18); // compressed size
  local.writeUInt32LE(data.length, 22); // uncompressed size
  local.writeUInt16LE(nameBuf.length, 26); // name length
  nameBuf.copy(local, 30);
  data.copy(local, 30 + nameBuf.length);

  const central = Buffer.alloc(46 + nameBuf.length);
  central.writeUInt32LE(0x02014b50, 0); // signature
  central.writeUInt16LE(0, 10); // method = stored
  central.writeUInt32LE(data.length, 20); // compressed size
  central.writeUInt32LE(data.length, 24); // uncompressed size
  central.writeUInt16LE(nameBuf.length, 28); // name length
  central.writeUInt32LE(0, 42); // local header offset
  nameBuf.copy(central, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(1, 10); // total entries
  eocd.writeUInt32LE(central.length, 12); // central dir size
  eocd.writeUInt32LE(local.length, 16); // central dir offset

  return Buffer.concat([local, central, eocd]);
}

describe('geonames.util', () => {
  const line = (cols: string[]): string => cols.join('\t');

  describe('parseRows', () => {
    it('projette les colonnes GeoNames et déduit région / coordonnées', () => {
      const tsv = line(['FR', '69001', 'Lyon', 'Auvergne-Rhône-Alpes', '84', '', '', '', '', '45.77', '4.83', '4']);
      const rows = parseRows(tsv);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        place: 'Lyon',
        postalCode: '69001',
        regionName: 'Auvergne-Rhône-Alpes',
        regionCode: '84',
        latitude: 45.77,
        longitude: 4.83,
      });
    });

    it('ignore les lignes sans commune ou sans code postal', () => {
      const tsv = [
        line(['FR', '', 'Sans code postal', 'R', '1', '', '', '', '', '', '', '']),
        line(['FR', '75000', '', 'R', '1', '', '', '', '', '', '', '']),
        '',
      ].join('\n');
      expect(parseRows(tsv)).toHaveLength(0);
    });

    it('replie une région manquante et respecte --limit', () => {
      const tsv = [
        line(['FR', '75001', 'Paris', '', '', '', '', '', '', '', '', '']),
        line(['FR', '75002', 'Paris', '', '', '', '', '', '', '', '', '']),
      ].join('\n');
      const rows = parseRows(tsv, 1);
      expect(rows).toHaveLength(1);
      expect(rows[0].regionName).toBe('(Région non renseignée)');
      expect(rows[0].regionCode).toBeNull();
    });
  });

  describe('readTsv', () => {
    it('lit un .txt brut', () => {
      const buf = Buffer.from('a\tb\tc', 'utf8');
      expect(readTsv(buf, 'FR.txt', 'FR')).toBe('a\tb\tc');
    });

    it('extrait l’entrée {CC}.txt d’une archive .zip', () => {
      const zip = buildStoredZip('FR.txt', 'FR\t75001\tParis');
      expect(readTsv(zip, 'FR.zip', 'FR')).toBe('FR\t75001\tParis');
    });
  });

  describe('extractZipEntry', () => {
    it('retrouve une entrée par suffixe de nom', () => {
      const zip = buildStoredZip('BE.txt', 'contenu-belge');
      expect(extractZipEntry(zip, 'BE.txt').toString('utf8')).toBe('contenu-belge');
    });

    it('échoue clairement si l’entrée est absente', () => {
      const zip = buildStoredZip('FR.txt', 'x');
      expect(() => extractZipEntry(zip, 'ZZ.txt')).toThrow(/absente/);
    });
  });
});
