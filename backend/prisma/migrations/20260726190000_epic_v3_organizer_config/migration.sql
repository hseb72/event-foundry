-- FSPEC.16-A : informations générales de l'organisation + activités couvertes.

ALTER TABLE "organizations"
  ADD COLUMN "contact_email" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "logo_url" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "created_by_id" UUID;

CREATE TABLE "organization_activities" (
  "organization_id" UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_activities_pkey" PRIMARY KEY ("organization_id", "activity_id")
);

CREATE INDEX "organization_activities_activity_id_idx" ON "organization_activities" ("activity_id");

ALTER TABLE "organization_activities"
  ADD CONSTRAINT "organization_activities_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_activities"
  ADD CONSTRAINT "organization_activities_activity_id_fkey"
  FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
