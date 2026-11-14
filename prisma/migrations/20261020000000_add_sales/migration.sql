-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "clientName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "grossBs" INTEGER NOT NULL,
    "supplierBs" INTEGER NOT NULL,
    "netBs" INTEGER NOT NULL,
    "rate" DECIMAL(14,4) NOT NULL,
    "rateSource" TEXT NOT NULL,
    "grossUsdt" INTEGER NOT NULL,
    "supplierUsdt" INTEGER NOT NULL,
    "netUsdt" INTEGER NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_userId_soldAt_idx" ON "sales"("userId", "soldAt");

-- CreateIndex
CREATE INDEX "sales_subscriptionId_idx" ON "sales"("subscriptionId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

