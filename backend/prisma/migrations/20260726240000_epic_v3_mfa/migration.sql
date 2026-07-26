-- FSPEC.18 §MFA : authentification multifacteur (TOTP).
ALTER TABLE "users"
  ADD COLUMN "mfa_secret" TEXT,
  ADD COLUMN "mfa_enabled_at" TIMESTAMPTZ(6),
  ADD COLUMN "mfa_recovery_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
