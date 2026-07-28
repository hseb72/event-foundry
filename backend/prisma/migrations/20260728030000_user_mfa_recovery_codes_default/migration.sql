-- FSPEC.18 (correctif) : `users.mfa_recovery_codes` est NOT NULL sans défaut → toute création
-- d'utilisateur qui omet le champ échoue (Prisma 7 ne pré-remplit pas les listes scalaires).
-- On pose le défaut « liste vide » en base (aligné sur `@default([])` du schéma).
ALTER TABLE "users" ALTER COLUMN "mfa_recovery_codes" SET DEFAULT ARRAY[]::text[];
