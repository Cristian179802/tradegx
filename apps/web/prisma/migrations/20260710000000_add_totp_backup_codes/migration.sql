-- Aditiv: coduri de rezervă 2FA (hash-uite). Nu afectează codul existent.
ALTER TABLE "User" ADD COLUMN "totpBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
