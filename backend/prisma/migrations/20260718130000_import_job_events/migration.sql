-- Journal des transitions d'état d'un ImportJob (stats sur les passages entre états).
-- CreateTable
CREATE TABLE "import_job_events" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "status" "ImportJobStatus" NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_job_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_job_events_import_job_id_idx" ON "import_job_events"("import_job_id");

-- CreateIndex
CREATE INDEX "import_job_events_status_idx" ON "import_job_events"("status");

-- CreateIndex
CREATE INDEX "import_job_events_occurred_at_idx" ON "import_job_events"("occurred_at");

-- AddForeignKey
ALTER TABLE "import_job_events" ADD CONSTRAINT "import_job_events_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
