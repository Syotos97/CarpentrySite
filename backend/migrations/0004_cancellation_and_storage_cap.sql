ALTER TABLE orders ADD COLUMN cancelled_at TEXT;
ALTER TABLE orders ADD COLUMN sketch_bytes INTEGER;

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_sketch_bytes INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO app_state (id, total_sketch_bytes) VALUES (1, 0);
