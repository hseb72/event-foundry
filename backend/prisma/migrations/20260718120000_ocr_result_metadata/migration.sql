-- Conservation des métadonnées de l'OCRResult source sur l'ImportJob
-- (traçabilité / rejouabilité du pipeline ; TSPEC.03 « Conservation des artefacts »).
-- AlterTable
ALTER TABLE "import_jobs"
  ADD COLUMN "ocr_confidence" DOUBLE PRECISION,
  ADD COLUMN "ocr_language" TEXT,
  ADD COLUMN "ocr_engine" TEXT,
  ADD COLUMN "ocr_engine_version" TEXT,
  ADD COLUMN "ocr_page_count" INTEGER,
  ADD COLUMN "ocr_processing_time_ms" INTEGER;
