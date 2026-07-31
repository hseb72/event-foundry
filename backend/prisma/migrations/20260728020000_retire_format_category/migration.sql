-- DATA.01 v2.0 (Solution A) — Retrait de Format et Catégorie, fusionnés dans les **Modalités**.
-- Le suivi/reco/recherche bascule de Category vers **Subject** (Axe A). Étape destructive avec
-- reprise des données ; V1 sans données de production (référentiels réamorcés par le seed).

-- 1) Reprise Format/Catégorie → Modalités (mapping par nom ; les noms sans modalité correspondante
--    sont abandonnés — ils sont réamorcés proprement par le seed v2.0).
INSERT INTO "event_modalities" ("event_id", "modality_id")
SELECT DISTINCT efl."event_id", m."id"
FROM "event_format_links" efl
JOIN "event_formats" ef ON ef."id" = efl."event_format_id"
JOIN "modalities" m ON m."name" = ef."name"
ON CONFLICT DO NOTHING;

INSERT INTO "event_modalities" ("event_id", "modality_id")
SELECT DISTINCT ecl."event_id", m."id"
FROM "event_category_links" ecl
JOIN "categories" c ON c."id" = ecl."category_id"
JOIN "modalities" m ON m."name" = c."name"
ON CONFLICT DO NOTHING;

-- 2) Follow : la cible CATEGORY disparaît au profit de SUBJECT. Les suivis de catégorie existants
--    (dev) ne se remappent pas déterministement vers un sujet → on les retire, puis on renomme la
--    valeur d'enum (les futurs suivis ciblent des sujets).
DELETE FROM "follows" WHERE "target_type" = 'CATEGORY';
ALTER TYPE "FollowTargetType" RENAME VALUE 'CATEGORY' TO 'SUBJECT';

-- 3) Projection de recherche : renommage des colonnes (catégories→sujets, formats→modalités).
ALTER TABLE "search_documents" RENAME COLUMN "category_ids" TO "subject_ids";
ALTER TABLE "search_documents" RENAME COLUMN "category_names" TO "subject_names";
ALTER TABLE "search_documents" RENAME COLUMN "format_ids" TO "modality_ids";
ALTER TABLE "search_documents" RENAME COLUMN "format_names" TO "modality_names";

-- 4) Suppression des tables Format/Catégorie et de leurs liaisons.
DROP TABLE IF EXISTS "event_format_links";
DROP TABLE IF EXISTS "event_category_links";
DROP TABLE IF EXISTS "event_formats";
DROP TABLE IF EXISTS "categories";
