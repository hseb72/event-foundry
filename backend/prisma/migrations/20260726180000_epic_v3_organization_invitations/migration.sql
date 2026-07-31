-- FSPEC.19-B : invitations à rejoindre une organisation.

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

CREATE TABLE "organization_invitations" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "function" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "token_hash" TEXT NOT NULL,
  "invited_by_id" UUID,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "accepted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organization_invitations_organization_id_status_idx" ON "organization_invitations" ("organization_id", "status");
CREATE INDEX "organization_invitations_token_hash_idx" ON "organization_invitations" ("token_hash");

ALTER TABLE "organization_invitations"
  ADD CONSTRAINT "organization_invitations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
