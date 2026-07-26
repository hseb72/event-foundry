-- Onboarding (acceptation des conditions) + invitations d'Operator par e-mail (FSPEC.16/17).

ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMPTZ(6);

CREATE TABLE "operator_invitations" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role_name" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "token_hash" TEXT NOT NULL,
  "invited_by_id" UUID,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "accepted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "operator_invitations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "operator_invitations_status_idx" ON "operator_invitations" ("status");
CREATE INDEX "operator_invitations_token_hash_idx" ON "operator_invitations" ("token_hash");
