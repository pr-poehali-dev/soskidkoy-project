ALTER TABLE nomenclature ADD COLUMN IF NOT EXISTS normalization_status VARCHAR(20) NOT NULL DEFAULT 'unchecked';

UPDATE nomenclature SET normalization_status = 'normalized' WHERE is_normalized = true AND normalization_status = 'unchecked';
