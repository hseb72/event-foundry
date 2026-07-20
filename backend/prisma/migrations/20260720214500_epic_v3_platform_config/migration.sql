-- Configuration plateforme (FSPEC.09 / TSPEC.09). Valeurs non secrètes ; secrets via secret_ref.
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "secret_ref" TEXT,
    "status" "SecretStatus" NOT NULL DEFAULT 'CONFIGURED',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_settings_section_key_key" ON "platform_settings"("section", "key");
