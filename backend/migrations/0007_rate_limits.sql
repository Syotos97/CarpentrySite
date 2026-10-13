CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits (key, created_at);
