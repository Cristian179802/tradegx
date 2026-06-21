-- AlterTable
ALTER TABLE "User" ADD COLUMN     "monthlyProfitTarget" DECIMAL(15,2),
ADD COLUMN     "monthlyTradeTarget" INTEGER,
ADD COLUMN     "monthlyWinRateTarget" INTEGER;
