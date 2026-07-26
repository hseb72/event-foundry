-- FSPEC.21-B : règles de routage configurables + motif de clôture.

ALTER TABLE "cases" ADD COLUMN "close_reason" TEXT;

CREATE TABLE "case_routing_rules" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "criteria" JSONB NOT NULL,
  "result" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "case_routing_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "case_routing_rules_is_active_order_index_idx" ON "case_routing_rules" ("is_active", "order_index");
