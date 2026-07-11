CREATE TABLE IF NOT EXISTS "TronMatch" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid REFERENCES "User"("id"),
  "won" boolean NOT NULL,
  "playerScore" integer NOT NULL DEFAULT 0,
  "aiScore" integer NOT NULL DEFAULT 0,
  "rounds" integer NOT NULL DEFAULT 0,
  "survivalTicks" integer NOT NULL DEFAULT 0,
  "turnBias" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
