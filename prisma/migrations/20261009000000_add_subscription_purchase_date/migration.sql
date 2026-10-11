-- Date of the last payment: set on creation and on every renewal
ALTER TABLE "subscriptions" ADD COLUMN "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing subscriptions: use their creation date
UPDATE "subscriptions" SET "purchaseDate" = "createdAt";
