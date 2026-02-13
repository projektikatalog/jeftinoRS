-- Add is_promo column to proizvodi table
ALTER TABLE proizvodi ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT false;

-- Insert initial promo settings if they don't exist
INSERT INTO admin_settings (key, value)
VALUES ('promo_settings', '{"isActionActive": false, "actionTitle": "", "requiredQuantity": 4, "totalPrice": 7000}')
ON CONFLICT (key) DO NOTHING;
