-- CreateEnum
CREATE TYPE "RecommendationAction" AS ENUM ('ACCEPTED', 'IGNORED', 'REJECTED');

-- CreateTable
CREATE TABLE "recommendation_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "action" "RecommendationAction" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recommendation_feedback_user_id_idx" ON "recommendation_feedback"("user_id");

-- CreateIndex
CREATE INDEX "recommendation_feedback_event_id_idx" ON "recommendation_feedback"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_feedback_user_id_event_id_key" ON "recommendation_feedback"("user_id", "event_id");

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
