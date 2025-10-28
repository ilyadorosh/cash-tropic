-- Migration: Add Profile and GeneratedPage tables for ActInLove feature
-- Created: 2025-10-27

-- Create Profile table
CREATE TABLE IF NOT EXISTS "Profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" VARCHAR(64) UNIQUE NOT NULL,
  "context" TEXT,
  "createdAt" TIMESTAMP NOT NULL
);

-- Create GeneratedPage table
CREATE TABLE IF NOT EXISTS "GeneratedPage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fromProfileId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "toProfileId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
  "customPrompt" TEXT,
  "generatedHtml" TEXT,
  "createdAt" TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_profile_username" ON "Profile"("username");
CREATE INDEX IF NOT EXISTS "idx_generated_page_from" ON "GeneratedPage"("fromProfileId");
CREATE INDEX IF NOT EXISTS "idx_generated_page_to" ON "GeneratedPage"("toProfileId");
CREATE INDEX IF NOT EXISTS "idx_generated_page_created" ON "GeneratedPage"("createdAt");
