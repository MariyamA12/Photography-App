-- 006_create_notifications_sent_table.sql

CREATE TABLE IF NOT EXISTS notifications_sent (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (
    type IN (
      'preference_request',          -- Sent to parents asking for photo choices
      'photo_ready',                 -- Future use
      'reminder',                    -- Future use
      'response_received',           -- Future use
      'photographer_assignment',     -- Sent to photographer when assigned
      'photographer_reminder'        -- Future use
    )
  ),
  message TEXT NOT NULL,
  delivery_type VARCHAR(20) NOT NULL CHECK (
    delivery_type IN ('email', 'push', 'both')
  ),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id, type)
);
