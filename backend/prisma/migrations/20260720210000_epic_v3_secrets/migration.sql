-- Secrets Management (ADR.21 / TSPEC.08) : métadonnées (secret_refs) + valeur chiffrée (secret_material).
CREATE TYPE "SecretType" AS ENUM ('API_KEY', 'SMTP', 'OAUTH_SECRET', 'TLS_CERT', 'AI_KEY', 'DB_CREDENTIALS', 'OTHER');
CREATE TYPE "SecretScope" AS ENUM ('PLATFORM', 'ORGANIZATION', 'USER');
CREATE TYPE "SecretStatus" AS ENUM ('CONFIGURED', 'TESTED', 'FAILED', 'EXPIRED', 'REVOKED');

CREATE TABLE "secret_refs" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "SecretType" NOT NULL,
    "scope" "SecretScope" NOT NULL,
    "scope_id" UUID,
    "provider" TEXT,
    "last_four" TEXT,
    "status" "SecretStatus" NOT NULL DEFAULT 'CONFIGURED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "rotated_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "secret_refs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "secret_refs_reference_key" ON "secret_refs"("reference");
CREATE INDEX "secret_refs_scope_scope_id_idx" ON "secret_refs"("scope", "scope_id");

CREATE TABLE "secret_material" (
    "reference" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "secret_material_pkey" PRIMARY KEY ("reference")
);
