-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE 'PRICE_ALERT';

-- AlterTable
ALTER TABLE "WatchlistItem" ADD COLUMN     "alertAbove" DECIMAL(15,5),
ADD COLUMN     "alertBelow" DECIMAL(15,5);

