ALTER TABLE player_health_state ADD COLUMN steps_today INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_health_state ADD COLUMN steps_date DATE;
ALTER TABLE player_health_state ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;
