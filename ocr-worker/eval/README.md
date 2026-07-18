# Banc d'évaluation OCR

Mesure la qualité de l'OCR (prétraitement `sharp` + Tesseract réglé) sur de vraies affiches,
**hors** pipeline (aucun accès base/backend). Sert à régler les paramètres avant de toucher au
worker (TSPEC.04).

## Utilisation

1. Déposez des affiches (`.jpg`, `.png`, …) dans `ocr-worker/eval/fixtures/`.
2. Créez `fixtures.json` (voir `fixtures.example.json`) associant chaque image aux mots-clés
   qui devraient être reconnus.
3. Lancez :

   ```bash
   npm run eval --workspace ocr-worker            # dossier fixtures/ par défaut
   npm run eval --workspace ocr-worker -- /chemin/vers/mes-affiches
   ```

La sortie donne, par image : la variante de prétraitement retenue, la confiance, le rappel de
mots-clés, et un extrait du texte — plus un rappel moyen agrégé.

## Réglages (variables d'environnement)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `OCR_LANGUAGES` | `eng` | langues Tesseract (ex. `fra+eng`) |
| `OCR_PSM` | `11` (sparse) | mode de segmentation de page |
| `OCR_OEM` | `1` (LSTM) | moteur |
| `OCR_TESSDATA` | `best` | `best` (précis) ou `fast` |
| `OCR_MIN_WIDTH` | `1500` | largeur cible d'upscaling |
| `OCR_BINARIZE_THRESHOLD` | `140` | seuil de binarisation |

> Les fixtures (affiches) ne sont pas versionnées : n'ajoutez pas d'images sous droits.
