-- 18-A Identity & Account (FSPEC.18) : cycle de vie du compte, jetons à usage unique, audit sécurité.

CREATE TYPE "AccountStatus" AS ENUM ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "AccountTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'INVITATION');

-- Les comptes existants sont considérés actifs et vérifiés (pas de rétro-vérification).
ALTER TABLE "users"
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);
UPDATE "users" SET "email_verified_at" = "created_at";
UPDATE "users" SET "status" = 'SUSPENDED' WHERE "is_active" = false;

CREATE TABLE "account_tokens" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "AccountTokenType" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "payload" JSONB,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "account_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");
CREATE INDEX "account_tokens_user_id_type_idx" ON "account_tokens"("user_id", "type");

CREATE TABLE "security_events" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "type" TEXT NOT NULL,
  "metadata" JSONB,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "security_events_user_id_occurred_at_idx" ON "security_events"("user_id", "occurred_at");
