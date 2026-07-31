-- Origine durable d'un Event (FSPEC.22) : distingue un événement privé personnel (organization_id
-- NULL, visibility PRIVATE) d'un événement créé dans le cadre d'une organisation (organization_id
-- renseigné, visibility PUBLIC). Migration additive (colonne nullable + FK SetNull + index).

ALTER TABLE "events" ADD COLUMN "organization_id" UUID;

ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "events_organization_id_idx" ON "events" ("organization_id");
