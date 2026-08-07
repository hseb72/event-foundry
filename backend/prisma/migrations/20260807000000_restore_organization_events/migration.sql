-- Réattribue à leur organisation les événements issus d'une soumission d'organisation qui avaient
-- été rangés par erreur dans l'espace personnel de leur valideur.
--
-- Cause corrigée dans le code : la validation d'un brouillon décidait de l'inventaire de destination
-- d'après le droit `event.publish` du **valideur**, et non d'après l'origine de la **soumission**
-- (FSPEC.22 §15, ESUB-013). Un agent d'organisation dépourvu de ce droit produisait donc un
-- événement privé personnel (`visibility = PRIVATE`, `organization_id = NULL`) : l'organisation
-- perdait sa soumission au profit de « Mes événements privés » de l'agent.
--
-- Reprise : l'origine reste lisible via le candidat (`event_candidates.event_id`) et son ImportJob,
-- qui porte l'organisation de la soumission. Seuls les événements **issus d'un import** et
-- effectivement rattachés à une soumission d'organisation sont repris ; un événement privé créé à la
-- main (source MANUAL) ou issu d'une soumission personnelle n'est jamais touché.
--
-- Le statut n'est pas modifié : un brouillon reste un brouillon. Rendre l'événement PUBLIC ne le
-- publie pas — la publication est une transition distincte, gardée par `event.publish`.

UPDATE "events" e
SET "visibility" = 'PUBLIC',
    "organization_id" = j."organization_id"
FROM "event_candidates" c
JOIN "import_jobs" j ON j."id" = c."import_job_id"
WHERE c."event_id" = e."id"
  AND e."source" = 'IMPORT'
  AND e."visibility" = 'PRIVATE'
  AND e."organization_id" IS NULL
  AND j."organization_id" IS NOT NULL;
