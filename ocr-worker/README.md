# @event-foundry/ocr-worker

Worker OCR : consomme `OCR_QUEUE` (`ImportRequest`), produit un `OCRResult` publié sur
`CLASSIFICATION_QUEUE`. **Aucune connaissance métier, aucun accès PostgreSQL** (TSPEC.04).

## Pipeline interne (ADR.07 — dépendance aux abstractions)

```
ImportRequest
   → DocumentLoader   (MinioDocumentLoader : clé déterministe attachments/{attachmentId})
   → ImageProcessor   (PassthroughImageProcessor — prétraitement OpenCV à venir)
   → OcrEngine        (TesseractOcrEngine, via tesseract.js)
   → OcrPostProcessor (normalisation Unicode, nettoyage)
   → OCRResult        → CLASSIFICATION_QUEUE
```

Chaque étape est liée à son abstraction (`DOCUMENT_LOADER`, `IMAGE_PROCESSOR`,
`OCR_ENGINE`) via un token NestJS et peut être remplacée sans toucher au reste.

Stateless, idempotent, répliquable, jamais exposé publiquement. Retry/backoff gérés par
BullMQ (options posées à la publication côté Backend).

## Limites connues (V1)

- **OpenCV** : le prétraitement d'image (grayscale, deskew, binarisation) reste à
  implémenter derrière `ImageProcessor` (ADR.04). L'implémentation actuelle est un
  passthrough.
- **PDF** : la rasterisation des PDF avant OCR n'est pas encore branchée.

## Démarrage

```bash
npm run infra:up            # Redis + MinIO
npm run start:dev --workspace @event-foundry/ocr-worker
```

Variables : `REDIS_HOST/PORT`, `MINIO_*`, `OCR_LANGUAGES`, `OCR_CONCURRENCY`.
