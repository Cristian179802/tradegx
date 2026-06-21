-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('ACTIVE', 'TP_HIT', 'SL_HIT', 'EXPIRED');

-- CreateTable
CREATE TABLE "AiSignal" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "instrumentType" "InstrumentType" NOT NULL DEFAULT 'FOREX',
    "direction" "TradeDirection" NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'H4',
    "entryPrice" DECIMAL(15,5) NOT NULL,
    "stopLoss" DECIMAL(15,5) NOT NULL,
    "takeProfit" DECIMAL(15,5) NOT NULL,
    "takeProfit2" DECIMAL(15,5),
    "riskReward" DECIMAL(5,2) NOT NULL,
    "confidence" INTEGER NOT NULL,
    "setupType" "SetupType",
    "bias" TEXT,
    "session" "SessionType",
    "rationale" TEXT NOT NULL,
    "confirmation" TEXT NOT NULL,
    "invalidation" TEXT,
    "status" "SignalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiSignal_date_idx" ON "AiSignal"("date");
