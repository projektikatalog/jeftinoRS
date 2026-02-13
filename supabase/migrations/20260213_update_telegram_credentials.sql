INSERT INTO admin_settings (key, value)
VALUES 
  ('telegram_bot_token', '7983877707:AAFhCej2mf6xR3ajYl3hJeNnAdx-Xu7vTjw'),
  ('telegram_chat_id', '7397589077')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = timezone('utc'::text, now());
