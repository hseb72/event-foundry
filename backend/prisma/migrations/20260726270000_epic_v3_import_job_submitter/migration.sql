-- FSPEC.22 §5-6 — Auteur de la soumission d'import : chacun peut suivre ses propres soumissions
-- (entonnoir de soumission Explorer). Nullable : jobs système / connecteurs automatiques sans
-- utilisateur, et l'attribution survit à la suppression du compte (ON DELETE SET NULL).

ALTER TABLE "import_jobs"
  ADD COLUMN "created_by_id" UUID;

ALTER TABLE "import_jobs"
  ADD CONSTRAINT "import_jobs_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "import_jobs_created_by_id_idx" ON "import_jobs" ("created_by_id");
