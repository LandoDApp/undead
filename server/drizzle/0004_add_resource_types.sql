-- Add resource type to collectible_points
ALTER TABLE "collectible_points" ADD COLUMN "resource_type" text NOT NULL DEFAULT 'herb';

-- Add resource balance columns to player_points
ALTER TABLE "player_points" ADD COLUMN "herbs" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_points" ADD COLUMN "crystals" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_points" ADD COLUMN "relics" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_points" ADD COLUMN "lifetime_herbs" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_points" ADD COLUMN "lifetime_crystals" integer NOT NULL DEFAULT 0;
ALTER TABLE "player_points" ADD COLUMN "lifetime_relics" integer NOT NULL DEFAULT 0;

-- Migrate existing total_points into herbs (they were all herb-equivalent)
UPDATE "player_points" SET "herbs" = "total_points", "lifetime_herbs" = "lifetime_earned";
