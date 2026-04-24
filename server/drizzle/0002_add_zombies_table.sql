CREATE TABLE "zombies" (
	"id" text PRIMARY KEY NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"grid_cell" text NOT NULL,
	"is_alive" boolean DEFAULT true NOT NULL,
	"dead_until" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "zombies_grid_cell_idx" ON "zombies" ("grid_cell");
--> statement-breakpoint
CREATE INDEX "zombies_lat_lon_idx" ON "zombies" ("latitude","longitude");
--> statement-breakpoint
CREATE INDEX "zombies_grid_cell_alive_idx" ON "zombies" ("grid_cell","is_alive");
