-- EPIC V3-01/02/03 — Framework d'import unifié : Raw Event (ADR.15), ImportSource (ADR.13),
-- statuts du pipeline (ADR.14). Modifications additives et rétro-compatibles avec le canal OCR V2.

-- Nouveaux statuts du pipeline (coexistent avec les statuts OCR hérités).
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'DISCOVERING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'FETCHING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'EXTRACTING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'VALIDATING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'NORMALIZING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'DEDUPLICATING';
ALTER TYPE "ImportJobStatus" ADD VALUE IF NOT EXISTS 'PERSISTING';

-- Canal d'acquisition et niveau de confiance d'une source.
CREATE TYPE "ImportChannel" AS ENUM ('IMAGE', 'TEXT', 'CSV', 'JSON', 'URL');
CREATE TYPE "SourceTrustLevel" AS ENUM ('TRUSTED', 'REVIEW');

-- Source d'acquisition configurée (fournisseur + config, séparés du code — ADR.13).
CREATE TABLE "import_sources" (
    "id" UUID NOT NULL,
    "provider_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secret_ref" TEXT,
    "trust_level" "SourceTrustLevel" NOT NULL DEFAULT 'REVIEW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_sources_provider_id_idx" ON "import_sources"("provider_id");
CREATE INDEX "import_sources_is_active_idx" ON "import_sources"("is_active");

-- Raw Event immuable (ADR.15) : représentation fidèle des données source, conservée (rejeu/audit).
CREATE TABLE "raw_events" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_key" TEXT,
    "connector_version" TEXT NOT NULL,
    "acquired_at" TIMESTAMPTZ(6) NOT NULL,
    "payload" JSONB NOT NULL,
    "media_refs" TEXT[],
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "raw_events_import_job_id_idx" ON "raw_events"("import_job_id");
CREATE INDEX "raw_events_provider_id_provider_key_idx" ON "raw_events"("provider_id", "provider_key");

-- Extension d'ImportJob pour le framework (colonnes nullables : jobs OCR V2 inchangés).
ALTER TABLE "import_jobs"
    ADD COLUMN "channel" "ImportChannel",
    ADD COLUMN "provider_id" TEXT,
    ADD COLUMN "import_source_id" UUID,
    ADD COLUMN "objects_read" INTEGER,
    ADD COLUMN "raw_event_count" INTEGER,
    ADD COLUMN "created_count" INTEGER,
    ADD COLUMN "updated_count" INTEGER,
    ADD COLUMN "duplicate_count" INTEGER,
    ADD COLUMN "rejected_count" INTEGER;

CREATE INDEX "import_jobs_provider_id_idx" ON "import_jobs"("provider_id");

ALTER TABLE "import_jobs"
    ADD CONSTRAINT "import_jobs_import_source_id_fkey"
    FOREIGN KEY ("import_source_id") REFERENCES "import_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "raw_events"
    ADD CONSTRAINT "raw_events_import_job_id_fkey"
    FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
