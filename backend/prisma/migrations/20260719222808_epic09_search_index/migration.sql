-- CreateTable
CREATE TABLE "search_documents" (
    "event_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activity_id" UUID NOT NULL,
    "activity_name" TEXT NOT NULL,
    "category_id" UUID,
    "category_name" TEXT,
    "municipality_id" UUID,
    "municipality_name" TEXT,
    "organizer_name" TEXT,
    "venue_name" TEXT,
    "tag_ids" UUID[],
    "tag_names" TEXT[],
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "search_vector" tsvector,
    "indexed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_documents_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "search_documents_activity_id_idx" ON "search_documents"("activity_id");

-- CreateIndex
CREATE INDEX "search_documents_category_id_idx" ON "search_documents"("category_id");

-- CreateIndex
CREATE INDEX "search_documents_municipality_id_idx" ON "search_documents"("municipality_id");

-- CreateIndex
CREATE INDEX "search_documents_starts_at_idx" ON "search_documents"("starts_at");

-- CreateIndex
CREATE INDEX "search_documents_search_vector_idx" ON "search_documents" USING GIN ("search_vector");

-- AddForeignKey
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
