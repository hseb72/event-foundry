-- DATA.01 v2.0 — Taxonomie 4 axes (phase additive).
-- Introduit les nouveaux référentiels SANS retirer l'existant (EventType scopé, EventFormat,
-- Category) : ils cohabitent le temps de la migration des données (cf. DATA.01 §9). Aucune
-- suppression ici — le rewire Event + le déplacement des données feront l'objet d'une migration
-- ultérieure.

-- --- Enum type de lieu --------------------------------------------------------------------------
CREATE TYPE "VenueType" AS ENUM ('GAME_STORE', 'BAR', 'EVENT_HALL', 'CLUB', 'ASSOCIATION', 'ONLINE', 'OTHER');

-- --- Venue : enrichissement (fiche de lieu plus complète) --------------------------------------
ALTER TABLE "venues" ADD COLUMN "description" TEXT;
ALTER TABLE "venues" ADD COLUMN "venue_type" "VenueType";
ALTER TABLE "venues" ADD COLUMN "country" TEXT;
ALTER TABLE "venues" ADD COLUMN "phone" TEXT;
ALTER TABLE "venues" ADD COLUMN "website" TEXT;

-- --- Axe A : Family -----------------------------------------------------------------------------
CREATE TABLE "activity_families" (
  "id"          UUID NOT NULL,
  "name"        TEXT NOT NULL,
  "activity_id" UUID NOT NULL,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "provisional" BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "activity_families_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "activity_families_activity_id_name_key" ON "activity_families" ("activity_id", "name");
CREATE INDEX "activity_families_activity_id_idx" ON "activity_families" ("activity_id");
ALTER TABLE "activity_families" ADD CONSTRAINT "activity_families_activity_id_fkey"
  FOREIGN KEY ("activity_id") REFERENCES "activities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Axe A : Subject ----------------------------------------------------------------------------
CREATE TABLE "subjects" (
  "id"          UUID NOT NULL,
  "name"        TEXT NOT NULL,
  "family_id"   UUID NOT NULL,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "provisional" BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_family_id_name_key" ON "subjects" ("family_id", "name");
CREATE INDEX "subjects_family_id_idx" ON "subjects" ("family_id");
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_family_id_fkey"
  FOREIGN KEY ("family_id") REFERENCES "activity_families" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Axe C : ModalityDimension ------------------------------------------------------------------
CREATE TABLE "modality_dimensions" (
  "id"         UUID NOT NULL,
  "name"       TEXT NOT NULL,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "modality_dimensions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "modality_dimensions_name_key" ON "modality_dimensions" ("name");

-- --- Axe C : Modality ---------------------------------------------------------------------------
CREATE TABLE "modalities" (
  "id"           UUID NOT NULL,
  "name"         TEXT NOT NULL,
  "dimension_id" UUID NOT NULL,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "provisional"  BOOLEAN NOT NULL DEFAULT false,
  "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "modalities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "modalities_name_key" ON "modalities" ("name");
CREATE INDEX "modalities_dimension_id_idx" ON "modalities" ("dimension_id");
ALTER TABLE "modalities" ADD CONSTRAINT "modalities_dimension_id_fkey"
  FOREIGN KEY ("dimension_id") REFERENCES "modality_dimensions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Liaisons N-N Event -------------------------------------------------------------------------
CREATE TABLE "event_subjects" (
  "event_id"   UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  CONSTRAINT "event_subjects_pkey" PRIMARY KEY ("event_id", "subject_id")
);
CREATE INDEX "event_subjects_subject_id_idx" ON "event_subjects" ("subject_id");
ALTER TABLE "event_subjects" ADD CONSTRAINT "event_subjects_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_subjects" ADD CONSTRAINT "event_subjects_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "event_modalities" (
  "event_id"    UUID NOT NULL,
  "modality_id" UUID NOT NULL,
  CONSTRAINT "event_modalities_pkey" PRIMARY KEY ("event_id", "modality_id")
);
CREATE INDEX "event_modalities_modality_id_idx" ON "event_modalities" ("modality_id");
ALTER TABLE "event_modalities" ADD CONSTRAINT "event_modalities_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_modalities" ADD CONSTRAINT "event_modalities_modality_id_fkey"
  FOREIGN KEY ("modality_id") REFERENCES "modalities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Liaisons N-N Venue -------------------------------------------------------------------------
CREATE TABLE "venue_activities" (
  "venue_id"    UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  CONSTRAINT "venue_activities_pkey" PRIMARY KEY ("venue_id", "activity_id")
);
CREATE INDEX "venue_activities_activity_id_idx" ON "venue_activities" ("activity_id");
ALTER TABLE "venue_activities" ADD CONSTRAINT "venue_activities_venue_id_fkey"
  FOREIGN KEY ("venue_id") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_activities" ADD CONSTRAINT "venue_activities_activity_id_fkey"
  FOREIGN KEY ("activity_id") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "venue_subjects" (
  "venue_id"   UUID NOT NULL,
  "subject_id" UUID NOT NULL,
  CONSTRAINT "venue_subjects_pkey" PRIMARY KEY ("venue_id", "subject_id")
);
CREATE INDEX "venue_subjects_subject_id_idx" ON "venue_subjects" ("subject_id");
ALTER TABLE "venue_subjects" ADD CONSTRAINT "venue_subjects_venue_id_fkey"
  FOREIGN KEY ("venue_id") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_subjects" ADD CONSTRAINT "venue_subjects_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "venue_tags" (
  "venue_id" UUID NOT NULL,
  "tag_id"   UUID NOT NULL,
  CONSTRAINT "venue_tags_pkey" PRIMARY KEY ("venue_id", "tag_id")
);
CREATE INDEX "venue_tags_tag_id_idx" ON "venue_tags" ("tag_id");
ALTER TABLE "venue_tags" ADD CONSTRAINT "venue_tags_venue_id_fkey"
  FOREIGN KEY ("venue_id") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_tags" ADD CONSTRAINT "venue_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Liaison N-N Organization -------------------------------------------------------------------
CREATE TABLE "organization_subjects" (
  "organization_id" UUID NOT NULL,
  "subject_id"      UUID NOT NULL,
  CONSTRAINT "organization_subjects_pkey" PRIMARY KEY ("organization_id", "subject_id")
);
CREATE INDEX "organization_subjects_subject_id_idx" ON "organization_subjects" ("subject_id");
ALTER TABLE "organization_subjects" ADD CONSTRAINT "organization_subjects_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_subjects" ADD CONSTRAINT "organization_subjects_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
