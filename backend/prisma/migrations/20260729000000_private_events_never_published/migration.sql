-- ESUB-009 : un événement **privé** est personnel et n'est jamais diffusé au catalogue.
-- La publication n'a aucun sens pour lui, et l'y laisser le rendait **non modifiable** (la
-- correction est réservée aux brouillons/soumis) sans offrir de dépublication côté Explorer.
--
-- Remise en cohérence des données existantes : tout événement privé publié repasse en brouillon.
-- `published_at` est remis à nul (il n'a jamais eu de diffusion à dater). Une ligne d'audit est
-- ajoutée au journal des transitions pour conserver la traçabilité (acteur inconnu : correction
-- automatique). Idempotent : ré-exécuté, l'UPDATE ne trouve plus aucune ligne.

INSERT INTO "event_status_events" ("id", "event_id", "from_status", "to_status", "actor_id", "occurred_at")
SELECT gen_random_uuid(), "id", 'PUBLISHED'::"EventStatus", 'DRAFT'::"EventStatus", NULL, now()
FROM "events"
WHERE "visibility" = 'PRIVATE' AND "status" = 'PUBLISHED';

UPDATE "events"
SET "status" = 'DRAFT'::"EventStatus", "published_at" = NULL, "updated_at" = now()
WHERE "visibility" = 'PRIVATE' AND "status" = 'PUBLISHED';

-- Un événement privé n'a jamais sa place dans l'index de recherche (projection du catalogue public).
DELETE FROM "search_documents" WHERE "event_id" IN (
  SELECT "id" FROM "events" WHERE "visibility" = 'PRIVATE'
);
