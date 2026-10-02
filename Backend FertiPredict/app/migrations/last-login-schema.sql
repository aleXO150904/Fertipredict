-- Historical accounts remain NULL until their next successful login.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
