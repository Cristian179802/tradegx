-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "route" TEXT,
    "userId" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorLog_fingerprint_key" ON "ErrorLog"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorLog_resolvedAt_lastSeen_idx" ON "ErrorLog"("resolvedAt", "lastSeen");

