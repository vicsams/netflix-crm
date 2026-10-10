-- Scope all business data to the user that owns it.
--
-- Existing rows were shared by every user. They are all assigned to the
-- oldest user account (the original owner of the data). If that is not the
-- right user, replace the subquery below with the desired user id before
-- applying this migration.
CREATE TEMP TABLE "_data_owner" AS
SELECT "id" FROM "user" ORDER BY "createdAt" ASC LIMIT 1;

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_createdById_fkey";

-- DropIndex
DROP INDEX "active_account_email_key";

-- DropIndex
DROP INDEX "clients_phoneNumber_key";

-- Services: give the whole existing catalog to the data owner
UPDATE "services" SET "createdById" = (SELECT "id" FROM "_data_owner");
ALTER TABLE "services" ALTER COLUMN "createdById" SET NOT NULL;

-- Active accounts
ALTER TABLE "active_account" ADD COLUMN "userId" TEXT;
UPDATE "active_account" SET "userId" = (SELECT "id" FROM "_data_owner");
ALTER TABLE "active_account" ALTER COLUMN "userId" SET NOT NULL;

-- Clients
ALTER TABLE "clients" ADD COLUMN "userId" TEXT;
UPDATE "clients" SET "userId" = (SELECT "id" FROM "_data_owner");
ALTER TABLE "clients" ALTER COLUMN "userId" SET NOT NULL;

-- Subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "userId" TEXT;
UPDATE "subscriptions" SET "userId" = (SELECT "id" FROM "_data_owner");
ALTER TABLE "subscriptions" ALTER COLUMN "userId" SET NOT NULL;

-- Bank earnings: the single shared row (id = 1) becomes the data owner's balance
ALTER TABLE "bank_earnings" ADD COLUMN "userId" TEXT;
UPDATE "bank_earnings" SET "userId" = (SELECT "id" FROM "_data_owner");
DELETE FROM "bank_earnings" WHERE "userId" IS NULL;
ALTER TABLE "bank_earnings" DROP CONSTRAINT "bank_earnings_pkey",
DROP COLUMN "id",
ALTER COLUMN "userId" SET NOT NULL,
ADD CONSTRAINT "bank_earnings_pkey" PRIMARY KEY ("userId");

-- Bank withdrawals
ALTER TABLE "bank_withdrawals" ADD COLUMN "userId" TEXT;
UPDATE "bank_withdrawals" SET "userId" = (SELECT "id" FROM "_data_owner");
ALTER TABLE "bank_withdrawals" ALTER COLUMN "userId" SET NOT NULL;

DROP TABLE "_data_owner";

-- CreateIndex
CREATE UNIQUE INDEX "active_account_userId_email_key" ON "active_account"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_phoneNumber_key" ON "clients"("userId", "phoneNumber");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "bank_withdrawals_userId_idx" ON "bank_withdrawals"("userId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_account" ADD CONSTRAINT "active_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_earnings" ADD CONSTRAINT "bank_earnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_withdrawals" ADD CONSTRAINT "bank_withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
