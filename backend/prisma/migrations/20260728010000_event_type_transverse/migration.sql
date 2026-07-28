-- DATA.01 v2.0 — Type **transverse** (TAX-004). L'EventType n'est plus rattaché à une Activité :
-- suppression de activity_id, `name` unique global. Étape destructive avec reprise des données.

-- 1) Dédoublonnage par nom : repointer les events vers l'exemplaire conservé.
--    NB : PostgreSQL n'a pas d'agrégat min()/max() pour le type uuid → on passe par le texte
--    (l'ordre lexicographique de la forme canonique d'un uuid coïncide avec son ordre binaire).
UPDATE "events" e
SET "event_type_id" = k."keep_id"
FROM "event_types" et
JOIN (SELECT "name", MIN("id"::text)::uuid AS "keep_id" FROM "event_types" GROUP BY "name") k
  ON k."name" = et."name"
WHERE e."event_type_id" = et."id"
  AND e."event_type_id" <> k."keep_id";

-- 2) Supprimer les doublons (on conserve l'exemplaire retenu par nom).
DELETE FROM "event_types" et
USING (SELECT "name", MIN("id"::text)::uuid AS "keep_id" FROM "event_types" GROUP BY "name") k
WHERE et."name" = k."name"
  AND et."id" <> k."keep_id";

-- 3) Retrait du rattachement à l'Activité.
ALTER TABLE "event_types" DROP CONSTRAINT IF EXISTS "event_types_activity_id_fkey";
DROP INDEX IF EXISTS "event_types_activity_id_idx";
DROP INDEX IF EXISTS "event_types_activity_id_name_key";
ALTER TABLE "event_types" DROP COLUMN IF EXISTS "activity_id";

-- 4) Unicité globale du nom.
CREATE UNIQUE INDEX "event_types_name_key" ON "event_types" ("name");
