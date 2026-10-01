CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_token TEXT UNIQUE NOT NULL,
  admin_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'invoice_sent',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  category TEXT,
  subcategory TEXT,
  wood_family TEXT,
  wood_species TEXT,
  dimension_preference TEXT,
  dimensions_summary TEXT,
  project_notes TEXT,
  has_sketch INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS status_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_status_log_order_id ON status_log(order_id);
