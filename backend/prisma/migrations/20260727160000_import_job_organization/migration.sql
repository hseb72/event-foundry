-- Origine « organisation » d'une soumission (FSPEC.22) : un import réalisé depuis l'expérience
-- Organizer porte l'organisation active (visible de toute l'équipe) ; un import Explorer reste
-- personnel (organization_id NULL). Migration additive.

ALTER TABLE "import_jobs" ADD COLUMN "organization_id" UUID;

ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "import_jobs_organization_id_idx" ON "import_jobs" ("organization_id");
