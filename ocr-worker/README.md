# @event-foundry/ocr-worker

Worker OCR : `ImportRequest` → `OCRResult`. **Aucune connaissance métier**, aucune
classification (TSPEC.04).

Pipeline interne : `Document Loader → Image Preprocessor → OCR Engine → OCR Post Processor`.

Dépendances aux abstractions uniquement (`OCREngine`, `ImageProcessor`), jamais
directement à Tesseract / OpenCV (ADR.07). Stateless, idempotent, répliquable, jamais
exposé publiquement.
