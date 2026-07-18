-- CreateTable
CREATE TABLE "user_participation" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "interested" BOOLEAN NOT NULL DEFAULT false,
    "reservation_status" "ReservationStatus" NOT NULL DEFAULT 'NONE',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_participation_user_id_idx" ON "user_participation"("user_id");

-- CreateIndex
CREATE INDEX "user_participation_event_id_idx" ON "user_participation"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_participation_user_id_event_id_key" ON "user_participation"("user_id", "event_id");

-- AddForeignKey
ALTER TABLE "user_participation" ADD CONSTRAINT "user_participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_participation" ADD CONSTRAINT "user_participation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
