-- Treapta PREMIUM: aceleasi functii ca PRO, dar cu cote AI mai mari.
--
-- Adaugarea unei valori de enum e aditiva: nu atinge randurile existente, nu
-- schimba nimic pentru abonatii actuali si nu poate esua pe date. `IF NOT EXISTS`
-- o face si idempotenta, deci se poate rula de doua ori fara efect.
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'PREMIUM';
