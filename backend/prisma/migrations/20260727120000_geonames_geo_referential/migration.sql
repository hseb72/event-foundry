-- Référentiel géographique alimenté par GeoNames (TSPEC.03) — migration additive.
-- 1) Region.code : code administratif de niveau 1 (GeoNames admin code1).
-- 2) Municipality.latitude / longitude : coordonnées GeoNames.
-- 3) Unicité de la commune élargie à (region, name, postal_code) : une commune peut porter
--    plusieurs codes postaux (GeoNames) — nécessaire à la résolution par code postal.

ALTER TABLE "regions" ADD COLUMN "code" TEXT;

ALTER TABLE "municipalities" ADD COLUMN "latitude"  DOUBLE PRECISION;
ALTER TABLE "municipalities" ADD COLUMN "longitude" DOUBLE PRECISION;

DROP INDEX IF EXISTS "municipalities_region_id_name_key";
CREATE UNIQUE INDEX "municipalities_region_id_name_postal_code_key"
  ON "municipalities" ("region_id", "name", "postal_code");
