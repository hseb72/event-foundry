-- FSPEC.20 : journal des décisions de modération.
CREATE TABLE "moderation_logs" (
  "id" UUID NOT NULL,
  "object_type" TEXT NOT NULL,
  "object_id" UUID NOT NULL,
  "decision" TEXT NOT NULL,
  "justification" TEXT,
  "operator_id" UUID,
  "case_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "moderation_logs_object_type_object_id_created_at_idx" ON "moderation_logs" ("object_type", "object_id", "created_at");
