-- Auth.js (NextAuth v5) + Drizzle adapter tables.
-- These live alongside the legacy "User" table (uuid PK, password auth) and
-- are managed entirely by the Auth.js Drizzle adapter.

CREATE TABLE IF NOT EXISTS "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_email_unique" ON "auth_user" ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "auth_account_provider_providerAccountId_pk" PRIMARY KEY ("provider", "providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "auth_verification_token_identifier_token_pk" PRIMARY KEY ("identifier", "token")
);
--> statement-breakpoint
ALTER TABLE "auth_account"
	ADD CONSTRAINT "auth_account_userId_auth_user_id_fk"
	FOREIGN KEY ("userId") REFERENCES "auth_user"("id")
	ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "auth_session"
	ADD CONSTRAINT "auth_session_userId_auth_user_id_fk"
	FOREIGN KEY ("userId") REFERENCES "auth_user"("id")
	ON DELETE cascade ON UPDATE no action;
