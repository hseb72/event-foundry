-- Localisation V3 (chantier §8.1) : indexer le code postal pour la recherche
-- « pays + code postal → commune(s) ». La région reste dérivée de la commune.
CREATE INDEX "municipalities_postal_code_idx" ON "municipalities"("postal_code");
