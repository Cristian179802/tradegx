-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('EMA_CROSSOVER', 'SESSION_BREAKOUT', 'RSI_REVERSAL', 'TREND_FOLLOWING');

-- AlterTable
ALTER TABLE "Backtest" ADD COLUMN     "avgRR" DECIMAL(6,2),
ADD COLUMN     "commission" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "equityCurve" JSONB,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "finalBalance" DECIMAL(15,2),
ADD COLUMN     "initialBalance" DECIMAL(15,2),
ADD COLUMN     "maxDrawdownPct" DECIMAL(8,4),
ADD COLUMN     "monthlyPnl" JSONB,
ADD COLUMN     "riskPerTrade" DECIMAL(5,2),
ADD COLUMN     "sortinoRatio" DECIMAL(6,2),
ADD COLUMN     "spread" DECIMAL(10,5) NOT NULL DEFAULT 0.00020,
ADD COLUMN     "totalBars" INTEGER;

-- AlterTable
ALTER TABLE "BacktestTrade" ADD COLUMN     "commission" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "exitReason" TEXT,
ADD COLUMN     "riskRewardRatio" DECIMAL(6,2),
ADD COLUMN     "stopLoss" DECIMAL(15,5),
ADD COLUMN     "takeProfit" DECIMAL(15,5);

-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN     "color" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "StrategyType" NOT NULL DEFAULT 'EMA_CROSSOVER';
