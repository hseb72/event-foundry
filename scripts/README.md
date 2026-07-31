# scripts

Outillage du dépôt (bootstrap, migrations, tâches de maintenance).

## Référentiel géographique (GeoNames)

Les communes sont un **référentiel local** alimenté par une ingestion **batch** depuis GeoNames
(jeu de données *codes postaux*), afin que le runtime ne dépende jamais de la disponibilité de
GeoNames (TSPEC.03). Script : `backend/scripts/import-geonames.ts`.

```bash
# Échantillon de test versionné (10 communes FR) — hors ligne, sans réseau
npm run geonames:import --workspace backend -- --file scripts/samples/FR-sample.txt

# Depuis un fichier complet déjà téléchargé (100 % hors ligne) — .txt, .zip ou .gz
npm run geonames:import --workspace backend -- --file ./FR.txt

# Téléchargement automatique depuis GeoNames (nécessite un accès réseau sortant)
npm run geonames:import --workspace backend -- --country FR --download

# Autre pays (nom FR facultatif ; sinon déduit du code, repli = le code)
npm run geonames:import --workspace backend -- --country BE --download --country-name "Belgique"

# Test rapide : limiter le nombre de lignes
npm run geonames:import --workspace backend -- --file ./FR.txt --limit 500
```

- **Idempotent** : ré-exécutable ; n'ajoute que les nouvelles communes, conserve l'existant.
- **Résilient** : en cas d'échec du téléchargement, rien n'est supprimé ; le référentiel en base
  reste servi. Les dumps téléchargés sont mis en cache dans `backend/scripts/.cache/` (ignoré par git).
- Source des dumps : <https://download.geonames.org/export/zip/> (fichier `{CC}.zip`, ex. `FR.zip`).
