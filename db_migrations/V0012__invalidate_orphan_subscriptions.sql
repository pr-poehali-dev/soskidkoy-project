UPDATE push_subscriptions 
SET endpoint = 'https://invalid.local/removed-' || id, 
    p256dh = 'invalid', 
    auth_key = 'invalid' 
WHERE admin_id IS NULL;
