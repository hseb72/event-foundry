-- Adresses d'organisation (Localisation V3, chantier §8.2).
CREATE TABLE "organization_addresses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "country_id" UUID NOT NULL,
    "municipality_id" UUID,
    "postal_code" TEXT NOT NULL,
    "street_lines" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organization_addresses_organization_id_idx" ON "organization_addresses"("organization_id");

ALTER TABLE "organization_addresses" ADD CONSTRAINT "organization_addresses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_addresses" ADD CONSTRAINT "organization_addresses_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "organization_addresses" ADD CONSTRAINT "organization_addresses_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
