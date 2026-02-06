-- Migration: Add TodoItem and TextSnippet tables for Dashboard
-- Created: 2026-01-22

-- Create TodoItem table
CREATE TABLE IF NOT EXISTS "TodoItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "priority" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP
);

-- Create TextSnippet table for clipboard persistence
CREATE TABLE IF NOT EXISTS "TextSnippet" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "content" TEXT NOT NULL,
  "title" VARCHAR(256),
  "tags" TEXT,
  "pinned" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_todo_user" ON "TodoItem"("userId");
CREATE INDEX IF NOT EXISTS "idx_todo_completed" ON "TodoItem"("completed");
CREATE INDEX IF NOT EXISTS "idx_todo_created" ON "TodoItem"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_snippet_user" ON "TextSnippet"("userId");
CREATE INDEX IF NOT EXISTS "idx_snippet_pinned" ON "TextSnippet"("pinned");
CREATE INDEX IF NOT EXISTS "idx_snippet_created" ON "TextSnippet"("createdAt");
