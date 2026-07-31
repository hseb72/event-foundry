-- Follow Domain (ADR.19 / FSPEC.06) : suivis durables utilisateur → objet (polymorphe).
CREATE TYPE "FollowTargetType" AS ENUM ('ORGANIZATION', 'ORGANIZER', 'VENUE', 'ACTIVITY', 'CATEGORY', 'EVENT_SERIES');

CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" "FollowTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "follows_user_id_target_type_target_id_key" ON "follows"("user_id", "target_type", "target_id");
CREATE INDEX "follows_target_type_target_id_idx" ON "follows"("target_type", "target_id");
CREATE INDEX "follows_user_id_deleted_at_idx" ON "follows"("user_id", "deleted_at");

ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
