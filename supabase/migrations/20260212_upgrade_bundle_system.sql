-- Update promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promo_image_url TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS required_items INTEGER DEFAULT 1;

-- Update products table
ALTER TABLE proizvodi ADD COLUMN IF NOT EXISTS only_bundle BOOLEAN DEFAULT false;

-- If required_items is added, we might want to sync it with existing data if possible, 
-- but since this is a new feature, we'll just set a default.
UPDATE promotions SET required_items = potrebna_kolicina WHERE required_items IS NULL OR required_items = 1;
