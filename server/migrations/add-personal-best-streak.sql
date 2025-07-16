-- Add personalBestStreak to user_stats table
ALTER TABLE user_stats 
ADD COLUMN personal_best_streak INTEGER NOT NULL DEFAULT 0;

-- Update existing records to set personal_best_streak to current study_streak if not already set
UPDATE user_stats 
SET personal_best_streak = study_streak 
WHERE personal_best_streak < study_streak;