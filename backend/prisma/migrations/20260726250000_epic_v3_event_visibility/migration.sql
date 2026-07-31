-- FSPEC.22 — Visibilité des événements (événements privés Explorer)
-- Un Event PRIVATE est un événement personnel visible uniquement de son créateur, jamais publié
-- ni indexé. Invariant : PRIVATE n'atteint jamais le statut PUBLISHED.

CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "events"
  ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

CREATE INDEX "events_created_by_id_idx" ON "events" ("created_by_id");
CREATE INDEX "events_visibility_idx" ON "events" ("visibility");
