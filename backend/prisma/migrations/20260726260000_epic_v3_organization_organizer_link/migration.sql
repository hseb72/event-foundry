-- FSPEC.22 §16 — Lien Organization ↔ Organizer (fiche du référentiel représentée par le compte).
-- Auto-déclaré et unique ; sert uniquement à notifier l'organisation qu'un événement privé la
-- mentionne. N'accorde aucun droit sur les événements privés (informational — ESUB-011).

ALTER TABLE "organizations"
  ADD COLUMN "organizer_id" UUID;

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_organizer_id_fkey"
  FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "organizations_organizer_id_key" ON "organizations" ("organizer_id");
