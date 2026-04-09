
ALTER TABLE products DROP CONSTRAINT products_condition_check;
ALTER TABLE products ADD CONSTRAINT products_condition_check CHECK (condition IN ('новый', 'как новый', 'отличный', 'хороший', 'под ремонт', 'утиль'));
