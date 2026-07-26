-- FSPEC.21 : Case Management (file unifiée d'intervention Operator).

CREATE TYPE "CaseStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'WAITING_FOR_ORGANIZER', 'RESOLVED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "cases" (
  "id" UUID NOT NULL,
  "reference" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "work_queue" TEXT NOT NULL,
  "status" "CaseStatus" NOT NULL DEFAULT 'NEW',
  "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "origin" TEXT NOT NULL,
  "requester_id" UUID,
  "assignee_id" UUID,
  "organization_id" UUID,
  "event_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "closed_at" TIMESTAMPTZ(6),
  CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cases_reference_key" ON "cases" ("reference");
CREATE INDEX "cases_status_domain_work_queue_idx" ON "cases" ("status", "domain", "work_queue");
CREATE INDEX "cases_assignee_id_idx" ON "cases" ("assignee_id");
CREATE INDEX "cases_requester_id_idx" ON "cases" ("requester_id");
CREATE INDEX "cases_priority_status_idx" ON "cases" ("priority", "status");

ALTER TABLE "cases" ADD CONSTRAINT "cases_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "case_events" (
  "id" UUID NOT NULL,
  "case_id" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "actor_id" UUID,
  "body" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
  "metadata" JSONB,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "case_events_case_id_occurred_at_idx" ON "case_events" ("case_id", "occurred_at");
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
