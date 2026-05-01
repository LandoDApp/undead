-- Bastions: one per player, upgradeable fortification
CREATE TABLE IF NOT EXISTS "bastions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL DEFAULT 'Meine Bastion',
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "level" integer NOT NULL DEFAULT 0,
  "hp" integer NOT NULL DEFAULT 50,
  "max_hp" integer NOT NULL DEFAULT 50,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- One bastion per player
CREATE UNIQUE INDEX IF NOT EXISTS "bastions_user_idx" ON "bastions"("user_id");

-- Spatial lookup for nearby bastions
CREATE INDEX IF NOT EXISTS "bastions_lat_lon_idx" ON "bastions"("latitude", "longitude");
