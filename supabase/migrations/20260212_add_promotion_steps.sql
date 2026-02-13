-- Add steps JSONB column to promotions table for slot-based builder
ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT NULL;

COMMENT ON COLUMN promotions.steps IS 'Array of step objects: [{ "title": "Korak 1", "filter": { "type": "category"|"product", "values": ["Torbe","Duksevi"] } }]';
