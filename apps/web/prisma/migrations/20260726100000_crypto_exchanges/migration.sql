-- Burse crypto native: Binance + Bybit
-- Strict aditiv. Cheile API NU se stochează aici în clar: merg în
-- UserIntegration, criptate AES-256-GCM cu același helper folosit la 2FA.

ALTER TYPE "BrokerSource" ADD VALUE IF NOT EXISTS 'BINANCE';
ALTER TYPE "BrokerSource" ADD VALUE IF NOT EXISTS 'BYBIT';
