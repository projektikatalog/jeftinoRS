INSERT INTO admin_settings (key, value)
VALUES 
  ('telegram_bot_token', ''),
  ('telegram_chat_id', '')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = timezone('utc'::text, now());
