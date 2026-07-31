-- ADR.24 — Auto-provisioning des référentiels : drapeau `provisional` (état provisoire, curable).
-- Additif et rétro-compatible : les référentiels existants restent définitifs (false par défaut).

ALTER TABLE "activities" ADD COLUMN "provisional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event_types" ADD COLUMN "provisional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event_formats" ADD COLUMN "provisional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizers" ADD COLUMN "provisional" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "venues" ADD COLUMN "provisional" BOOLEAN NOT NULL DEFAULT false;
