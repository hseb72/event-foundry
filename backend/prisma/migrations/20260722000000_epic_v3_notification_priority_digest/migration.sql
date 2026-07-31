-- 04-C Notifications : priorité (RG-NOTIF-05) + idempotence des récaps (planificateur quotidien/hebdo).

-- Priorité d'une notification (INFORMATION par défaut ; CRITICAL outrepasse les réglages de récap).
CREATE TYPE "NotificationPriority" AS ENUM ('INFORMATION', 'IMPORTANT', 'CRITICAL');

ALTER TABLE "notifications"
  ADD COLUMN "priority" "NotificationPriority" NOT NULL DEFAULT 'INFORMATION',
  ADD COLUMN "daily_digested_at" TIMESTAMPTZ(6),
  ADD COLUMN "weekly_digested_at" TIMESTAMPTZ(6);

-- Sélection efficace des notifications en attente de récap (une piste indépendante par colonne).
CREATE INDEX "notifications_daily_digested_at_idx" ON "notifications" ("daily_digested_at");
CREATE INDEX "notifications_weekly_digested_at_idx" ON "notifications" ("weekly_digested_at");
