-- Journal des appels IA (traçabilité ADR.16 / RG-AI-04) — jamais de contenu ni de clé.
CREATE TABLE "ai_call_logs" (
    "id" UUID NOT NULL,
    "use_case" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_call_logs_use_case_created_at_idx" ON "ai_call_logs"("use_case", "created_at");
