ALTER TABLE player_points ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_points ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_points ADD COLUMN last_login_date DATE;
ALTER TABLE player_points ADD COLUMN streak_freezes INTEGER NOT NULL DEFAULT 1;

CREATE TABLE daily_visions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vision_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  drawn_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX daily_visions_user_idx ON daily_visions(user_id);
