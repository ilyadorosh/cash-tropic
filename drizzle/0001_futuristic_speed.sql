CREATE TABLE IF NOT EXISTS "context_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_piece_id" varchar,
	"character" varchar,
	"response" text,
	"x" integer,
	"y" integer,
	"created_at" timestamp DEFAULT now()
);
