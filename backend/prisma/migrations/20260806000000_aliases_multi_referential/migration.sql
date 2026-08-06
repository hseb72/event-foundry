-- Alias multi-référentiels (DATA.01 v2.0).
--
-- Jusqu'ici un alias ne pouvait porter que sur une Activity. Depuis la taxonomie v2.0, ce qu'une
-- affiche abrège est surtout un **sujet** (« MTG » → Magic, « D&D » → Donjons & Dragons) ou un
-- **type** ; les alias sont donc étendus aux Subject, EventType, Organizer et Venue.
--
-- Choix de modélisation : des clés étrangères **explicites et nullables**, une par référentiel, plus
-- une contrainte garantissant qu'exactement une est renseignée. Une table polymorphe
-- (`target_type` + `target_id` sans FK) aurait été plus courte mais aurait abandonné l'intégrité
-- référentielle et le RESTRICT exigés par TSPEC.02.
--
-- Migration purement additive : les alias existants restent rattachés à leur activité.

ALTER TABLE "aliases" ALTER COLUMN "activity_id" DROP NOT NULL;

ALTER TABLE "aliases" ADD COLUMN IF NOT EXISTS "event_type_id" UUID;
ALTER TABLE "aliases" ADD COLUMN IF NOT EXISTS "subject_id" UUID;
ALTER TABLE "aliases" ADD COLUMN IF NOT EXISTS "organizer_id" UUID;
ALTER TABLE "aliases" ADD COLUMN IF NOT EXISTS "venue_id" UUID;

ALTER TABLE "aliases"
  ADD CONSTRAINT "aliases_event_type_id_fkey" FOREIGN KEY ("event_type_id")
  REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aliases"
  ADD CONSTRAINT "aliases_subject_id_fkey" FOREIGN KEY ("subject_id")
  REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aliases"
  ADD CONSTRAINT "aliases_organizer_id_fkey" FOREIGN KEY ("organizer_id")
  REFERENCES "organizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aliases"
  ADD CONSTRAINT "aliases_venue_id_fkey" FOREIGN KEY ("venue_id")
  REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "aliases_event_type_id_idx" ON "aliases"("event_type_id");
CREATE INDEX IF NOT EXISTS "aliases_subject_id_idx" ON "aliases"("subject_id");
CREATE INDEX IF NOT EXISTS "aliases_organizer_id_idx" ON "aliases"("organizer_id");
CREATE INDEX IF NOT EXISTS "aliases_venue_id_idx" ON "aliases"("venue_id");

-- Un alias désigne une cible et une seule : ni orphelin, ni ambigu.
ALTER TABLE "aliases"
  ADD CONSTRAINT "aliases_exactly_one_target"
  CHECK (num_nonnulls("activity_id", "event_type_id", "subject_id", "organizer_id", "venue_id") = 1);
