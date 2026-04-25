-- Add upgrade fields to safe_zones
ALTER TABLE "safe_zones" ADD COLUMN "max_charge" integer NOT NULL DEFAULT 100;
ALTER TABLE "safe_zones" ADD COLUMN "upgrade_level" integer NOT NULL DEFAULT 0;

-- Collectible points table
CREATE TABLE IF NOT EXISTS "collectible_points" (
  "id" text PRIMARY KEY NOT NULL,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "grid_cell" text NOT NULL,
  "value" integer NOT NULL DEFAULT 10,
  "expires_at" bigint NOT NULL,
  "collected_by" text REFERENCES "users"("id"),
  "collected_at" timestamp
);

CREATE INDEX IF NOT EXISTS "collectible_points_grid_cell_idx" ON "collectible_points" ("grid_cell");
CREATE INDEX IF NOT EXISTS "collectible_points_lat_lon_idx" ON "collectible_points" ("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "collectible_points_expires_at_idx" ON "collectible_points" ("expires_at");

-- Player points balance table
CREATE TABLE IF NOT EXISTS "player_points" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "total_points" integer NOT NULL DEFAULT 0,
  "lifetime_earned" integer NOT NULL DEFAULT 0,
  "lifetime_spent" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
