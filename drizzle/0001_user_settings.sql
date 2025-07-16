-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Display settings
  display_name VARCHAR(255),
  
  -- Study settings
  daily_goal INTEGER NOT NULL DEFAULT 25,
  auto_advance BOOLEAN NOT NULL DEFAULT true,
  show_answer_immediately BOOLEAN NOT NULL DEFAULT false,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'sm2',
  
  -- Notification settings
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  study_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_streak_reminder BOOLEAN NOT NULL DEFAULT true,
  performance_alerts BOOLEAN NOT NULL DEFAULT true,
  reminder_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  
  -- Appearance settings
  theme VARCHAR(20) NOT NULL DEFAULT 'light',
  card_animations BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
    ON user_settings FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();