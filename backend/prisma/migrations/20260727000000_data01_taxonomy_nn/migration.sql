-- DATA.01 v1.1 — Réconciliation de la taxonomie des événements.
-- 1) Le Format et la Catégorie passent en cardinalité N-N (TAX-003/004) : tables de liaison.
-- 2) EventFormat devient un référentiel transverse (indépendant de l'Activité) : suppression de
--    activity_id, unicité sur le nom.
-- 3) La projection de recherche (search_documents) expose des listes de formats/catégories.
-- Les colonnes scalaires event_format_id / category_id des events sont supprimées (les données
-- fonctionnelles sont réamorcées par le seed généraliste — aucune donnée métier en production V1).

-- --- 1. Event : suppression des scalaires Format / Catégorie -------------------------------------
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_event_format_id_fkey";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_category_id_fkey";
DROP INDEX IF EXISTS "events_category_id_idx";
ALTER TABLE "events" DROP COLUMN IF EXISTS "event_format_id";
ALTER TABLE "events" DROP COLUMN IF EXISTS "category_id";

-- --- 2. EventFormat : référentiel transverse (drop activity_id, unicité sur le nom) --------------
ALTER TABLE "event_formats" DROP CONSTRAINT IF EXISTS "event_formats_activity_id_fkey";
DROP INDEX IF EXISTS "event_formats_activity_id_idx";
DROP INDEX IF EXISTS "event_formats_activity_id_name_key";
ALTER TABLE "event_formats" DROP COLUMN IF EXISTS "activity_id";
CREATE UNIQUE INDEX "event_formats_name_key" ON "event_formats" ("name");

-- --- 3. Tables de liaison N-N -------------------------------------------------------------------
CREATE TABLE "event_format_links" (
  "event_id"        UUID NOT NULL,
  "event_format_id" UUID NOT NULL,
  CONSTRAINT "event_format_links_pkey" PRIMARY KEY ("event_id", "event_format_id")
);
CREATE INDEX "event_format_links_event_format_id_idx" ON "event_format_links" ("event_format_id");
ALTER TABLE "event_format_links" ADD CONSTRAINT "event_format_links_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_format_links" ADD CONSTRAINT "event_format_links_event_format_id_fkey"
  FOREIGN KEY ("event_format_id") REFERENCES "event_formats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "event_category_links" (
  "event_id"    UUID NOT NULL,
  "category_id" UUID NOT NULL,
  CONSTRAINT "event_category_links_pkey" PRIMARY KEY ("event_id", "category_id")
);
CREATE INDEX "event_category_links_category_id_idx" ON "event_category_links" ("category_id");
ALTER TABLE "event_category_links" ADD CONSTRAINT "event_category_links_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_category_links" ADD CONSTRAINT "event_category_links_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- 4. Projection de recherche : listes de formats / catégories --------------------------------
DROP INDEX IF EXISTS "search_documents_category_id_idx";
ALTER TABLE "search_documents" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "search_documents" DROP COLUMN IF EXISTS "category_name";
ALTER TABLE "search_documents" ADD COLUMN "category_ids"   UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE "search_documents" ADD COLUMN "category_names" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "search_documents" ADD COLUMN "format_ids"     UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE "search_documents" ADD COLUMN "format_names"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
