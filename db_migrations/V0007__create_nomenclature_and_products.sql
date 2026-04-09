
CREATE TABLE nomenclature (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    article VARCHAR(100) UNIQUE,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    base_price NUMERIC(12, 2) DEFAULT 0,
    wholesale_price NUMERIC(12, 2) DEFAULT 0,
    watts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    nomenclature_id INTEGER NOT NULL REFERENCES nomenclature(id),
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('как новый', 'отличный', 'хороший')),
    condition_image_url TEXT DEFAULT '',
    price_retail NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nomenclature_name ON nomenclature(LOWER(name));
CREATE INDEX idx_nomenclature_article ON nomenclature(LOWER(article));
CREATE INDEX idx_products_nomenclature_id ON products(nomenclature_id);
