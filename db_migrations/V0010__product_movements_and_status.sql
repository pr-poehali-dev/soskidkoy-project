CREATE TABLE IF NOT EXISTS product_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  nomenclature_id INTEGER NOT NULL REFERENCES nomenclature(id),
  movement_type VARCHAR(32) NOT NULL,
  condition_before VARCHAR(20),
  condition_after VARCHAR(20),
  comment TEXT DEFAULT '',
  admin_id INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_nomenclature ON product_movements(nomenclature_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON product_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_created ON product_movements(created_at DESC);

ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'в наличии';
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
