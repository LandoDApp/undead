CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  expires_at BIGINT NOT NULL,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX quests_user_type_idx ON quests(user_id, quest_type);
CREATE INDEX quests_expires_idx ON quests(expires_at);
