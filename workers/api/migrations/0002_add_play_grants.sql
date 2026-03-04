CREATE TABLE IF NOT EXISTS play_grants (
  grant_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  spent INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(account_id)
);

CREATE INDEX IF NOT EXISTS idx_play_grants_account_id_slug
  ON play_grants(account_id, slug);

CREATE INDEX IF NOT EXISTS idx_play_grants_expires_at_ms
  ON play_grants(expires_at_ms);