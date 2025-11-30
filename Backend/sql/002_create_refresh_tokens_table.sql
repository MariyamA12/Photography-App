-- sql/002_create_refresh_tokens_table.sql

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token
  ON refresh_tokens(token);
