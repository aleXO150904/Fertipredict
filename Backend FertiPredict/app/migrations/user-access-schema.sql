-- Ejecutar en instalaciones que gestionen el esquema con migraciones.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE users ALTER COLUMN active SET DEFAULT true;
UPDATE users SET active = true WHERE active IS NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_version bigint;
COMMIT;
