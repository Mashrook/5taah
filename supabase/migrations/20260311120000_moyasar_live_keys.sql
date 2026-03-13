-- Update Moyasar publishable key to live
-- First deactivate any existing moyasar publishable keys
UPDATE api_keys SET is_active = false
WHERE service = 'moyasar' AND key_name = 'publishable_key';

-- Delete old ones and insert the live key
DELETE FROM api_keys WHERE service = 'moyasar' AND key_name = 'publishable_key';

INSERT INTO api_keys (service, key_name, key_value, is_active)
VALUES ('moyasar', 'publishable_key', 'pk_live_o5UZCUZNwD1GGLQu9uCbjhQaLLvoqF1HM3tVaSrJ', true);

-- Ensure payment provider is set to moyasar
UPDATE site_settings SET setting_value = 'moyasar'
WHERE setting_key = 'payment_provider' AND tenant_id IS NULL;

INSERT INTO site_settings (setting_key, setting_value, setting_type)
SELECT 'payment_provider', 'moyasar', 'text'
WHERE NOT EXISTS (
  SELECT 1 FROM site_settings WHERE setting_key = 'payment_provider' AND tenant_id IS NULL
);
