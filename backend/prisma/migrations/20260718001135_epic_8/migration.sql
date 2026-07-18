-- CreateTable
CREATE TABLE "event_candidates" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "status" "EventCandidateStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "event_id" UUID,
    "corrected_by" UUID,
    "corrected_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "source" "EventSource" NOT NULL,
    "activity_id" UUID NOT NULL,
    "event_type_id" UUID,
    "event_format_id" UUID,
    "organizer_id" UUID,
    "venue_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_candidates_event_id_key" ON "event_candidates"("event_id");

-- CreateIndex
CREATE INDEX "event_candidates_status_idx" ON "event_candidates"("status");

-- CreateIndex
CREATE INDEX "event_candidates_created_at_idx" ON "event_candidates"("created_at");

-- CreateIndex
CREATE INDEX "event_candidates_import_job_id_idx" ON "event_candidates"("import_job_id");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_venue_id_idx" ON "events"("venue_id");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_activity_id_idx" ON "events"("activity_id");

-- CreateIndex
CREATE INDEX "events_source_idx" ON "events"("source");

-- AddForeignKey
ALTER TABLE "event_candidates" ADD CONSTRAINT "event_candidates_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_candidates" ADD CONSTRAINT "event_candidates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_event_format_id_fkey" FOREIGN KEY ("event_format_id") REFERENCES "event_formats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
