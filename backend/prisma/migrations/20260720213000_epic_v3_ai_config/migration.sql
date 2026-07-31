-- Configuration IA par portée (ADR.16 / TSPEC.07). La clé API n'est PAS ici (référence de secret).
CREATE TABLE "ai_configs" (
    "id" UUID NOT NULL,
    "scope" "SecretScope" NOT NULL,
    "scope_key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "secret_ref" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "use_cases" JSONB NOT NULL,
    "status" "SecretStatus" NOT NULL DEFAULT 'CONFIGURED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_configs_scope_scope_key_key" ON "ai_configs"("scope", "scope_key");
