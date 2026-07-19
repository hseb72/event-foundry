-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'SUBMITTED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "published_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "event_status_events" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "from_status" "EventStatus",
    "to_status" "EventStatus" NOT NULL,
    "actor_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_status_events_event_id_occurred_at_idx" ON "event_status_events"("event_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_status_events" ADD CONSTRAINT "event_status_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
