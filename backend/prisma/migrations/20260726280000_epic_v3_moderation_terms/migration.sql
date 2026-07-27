-- FSPEC.22 §13 / FSPEC.20 — Référentiel des termes de modération (contenu interdit / spam).
-- Alimente les contrôles automatiques déterministes de soumission ; géré par les Operators
-- (aucune liste métier codée en dur — règle d'or n°1). Le référentiel démarre vide.

CREATE TYPE "ModerationTermKind" AS ENUM ('BANNED', 'SPAM');

CREATE TABLE "moderation_terms" (
  "id"         UUID NOT NULL,
  "term"       TEXT NOT NULL,
  "kind"       "ModerationTermKind" NOT NULL DEFAULT 'BANNED',
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "moderation_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "moderation_terms_term_key" ON "moderation_terms" ("term");
CREATE INDEX "moderation_terms_is_active_idx" ON "moderation_terms" ("is_active");
