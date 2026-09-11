-- Run through your database migration process before deploying the Java backend.
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_requested_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credentials_version bigint;
CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_hash_idx
    ON users (reset_token_hash) WHERE reset_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS predictions_date_idx ON predictions (date);
