-- Integrări broker noi: TradeLocker + DXtrade
--
-- Strict aditiv, deci sigur pe producție: nu se șterge și nu se redenumește
-- nimic, iar codul existent nu vede diferența.
--
-- Notă despre ALTER TYPE: pe PostgreSQL 12+ adăugarea unei valori de enum poate
-- rula în tranzacție atâta timp cât valoarea NU e folosită în aceeași
-- tranzacție. Aici doar o declarăm; e folosită abia de aplicație, ulterior.

ALTER TYPE "BrokerSource" ADD VALUE IF NOT EXISTS 'TRADELOCKER';
ALTER TYPE "BrokerSource" ADD VALUE IF NOT EXISTS 'DXTRADE';

-- Identificatori neutri de cont extern. TradeLocker cere ambele: id-ul contului
-- în cale și accNum ca antet la fiecare cerere către /trade/*.
ALTER TABLE "TradingAccount" ADD COLUMN IF NOT EXISTS "brokerAccountId" TEXT;
ALTER TABLE "TradingAccount" ADD COLUMN IF NOT EXISTS "brokerAccNum" INTEGER;
