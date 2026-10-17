// Copies all business data from one user account to another. The source
// account keeps its data; the target gets duplicates with new ids.
//
//   bun scripts/copy-user-data.ts <from-email> <to-email>            (dry run)
//   bun scripts/copy-user-data.ts <from-email> <to-email> --confirm  (apply)
import { randomUUID } from "crypto";
import net from "net";
import prisma from "@/shared/lib/db";

const [fromEmail, toEmail] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const confirm = process.argv.includes("--confirm");

// Under Bun, `pg` connections to Neon time out (ETIMEDOUT) while Bun races
// the host's addresses (autoSelectFamily); connecting to one at a time works.
// The pool connects lazily, so setting this before the first query is enough
net.setDefaultAutoSelectFamily(false);

if (!fromEmail || !toEmail) {
  console.error(
    "Usage: bun scripts/copy-user-data.ts <from-email> <to-email> [--confirm]",
  );
  process.exit(1);
}

// Maps an old id to the id of its copy, failing loudly on a dangling reference
function lookup(map: Map<string, string>, id: string, kind: string) {
  const newId = map.get(id);
  if (!newId) throw new Error(`Missing copied ${kind} for id ${id}`);
  return newId;
}

async function main() {
  const [from, to] = await Promise.all([
    prisma.user.findUnique({ where: { email: fromEmail } }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);

  if (!from) throw new Error(`User not found: ${fromEmail}`);
  if (!to) throw new Error(`User not found: ${toEmail}`);
  if (from.id === to.id) throw new Error("Source and target are the same user");

  const [
    services,
    accounts,
    screens,
    clients,
    subscriptions,
    withdrawals,
    fromBank,
  ] = await Promise.all([
    prisma.service.findMany({ where: { createdById: from.id } }),
    prisma.activeAccount.findMany({ where: { userId: from.id } }),
    prisma.screen.findMany({ where: { activeAccount: { userId: from.id } } }),
    prisma.client.findMany({ where: { userId: from.id } }),
    prisma.subscription.findMany({ where: { userId: from.id } }),
    prisma.bankWithdrawal.findMany({ where: { userId: from.id } }),
    prisma.bankEarnings.findUnique({ where: { userId: from.id } }),
  ]);

  console.log(`From: ${from.email} (${from.id})`);
  console.log(`To:   ${to.email} (${to.id})`);
  console.table({
    services: services.length,
    activeAccounts: accounts.length,
    screens: screens.length,
    clients: clients.length,
    subscriptions: subscriptions.length,
    withdrawals: withdrawals.length,
  });
  console.log(
    "Bank balance to copy:",
    fromBank
      ? `${(fromBank.total / 100).toFixed(2)} Bs, ${(fromBank.totalUsdt / 100).toFixed(2)} USDT`
      : "none",
  );

  // Account emails and client phone numbers are unique per user, so the
  // target cannot already have the same ones
  const [accountConflicts, clientConflicts] = await Promise.all([
    prisma.activeAccount.findMany({
      where: { userId: to.id, email: { in: accounts.map((a) => a.email) } },
      select: { email: true },
    }),
    prisma.client.findMany({
      where: {
        userId: to.id,
        phoneNumber: { in: clients.map((c) => c.phoneNumber) },
      },
      select: { phoneNumber: true },
    }),
  ]);

  if (accountConflicts.length || clientConflicts.length) {
    console.error("\nThe target user already has some of the same records:");
    accountConflicts.forEach((a) => console.error(`  account: ${a.email}`));
    clientConflicts.forEach((c) =>
      console.error(`  client phone: ${c.phoneNumber}`),
    );
    throw new Error("Resolve these conflicts before copying");
  }

  if (!confirm) {
    console.log("\nDry run: nothing changed. Re-run with --confirm to apply.");
    return;
  }

  // New ids are generated up front so every reference can be remapped
  const serviceIds = new Map(services.map((s) => [s.id, randomUUID()]));
  const accountIds = new Map(accounts.map((a) => [a.id, randomUUID()]));
  const screenIds = new Map(screens.map((s) => [s.id, randomUUID()]));
  const clientIds = new Map(clients.map((c) => [c.id, randomUUID()]));

  await prisma.$transaction(
    async (tx) => {
      await tx.service.createMany({
        data: services.map((s) => ({
          id: lookup(serviceIds, s.id, "service"),
          serviceName: s.serviceName,
          description: s.description,
          price: s.price,
          currency: s.currency,
          textColor: s.textColor,
          backgroundColor: s.backgroundColor,
          imageUrl: s.imageUrl,
          createdAt: s.createdAt,
          createdById: to.id,
        })),
      });

      await tx.activeAccount.createMany({
        data: accounts.map((a) => ({
          id: lookup(accountIds, a.id, "account"),
          email: a.email,
          // Already encrypted with the same key, so it is copied as-is
          password: a.password,
          serviceId: a.serviceId
            ? lookup(serviceIds, a.serviceId, "service")
            : null,
          expirationDate: a.expirationDate,
          createdAt: a.createdAt,
          userId: to.id,
        })),
      });

      await tx.screen.createMany({
        data: screens.map((s) => ({
          id: lookup(screenIds, s.id, "screen"),
          profileName: s.profileName,
          profilePIN: s.profilePIN,
          activeAccountId: lookup(accountIds, s.activeAccountId, "account"),
        })),
      });

      await tx.client.createMany({
        data: clients.map((c) => ({
          id: lookup(clientIds, c.id, "client"),
          clientName: c.clientName,
          phoneNumber: c.phoneNumber,
          createdAt: c.createdAt,
          userId: to.id,
        })),
      });

      await tx.subscription.createMany({
        data: subscriptions.map((s) => ({
          clientId: lookup(clientIds, s.clientId, "client"),
          activeAccountId: lookup(accountIds, s.activeAccountId, "account"),
          serviceId: lookup(serviceIds, s.serviceId, "service"),
          screenId: lookup(screenIds, s.screenId, "screen"),
          expirationDate: s.expirationDate,
          purchaseDate: s.purchaseDate,
          amount: s.amount,
          status: s.status,
          createdAt: s.createdAt,
          userId: to.id,
        })),
      });

      await tx.bankWithdrawal.createMany({
        data: withdrawals.map((w) => ({
          currency: w.currency,
          amount: w.amount,
          reason: w.reason,
          createdAt: w.createdAt,
          userId: to.id,
        })),
      });

      if (fromBank) {
        await tx.bankEarnings.upsert({
          where: { userId: to.id },
          update: {
            total: { increment: fromBank.total },
            totalUsdt: { increment: fromBank.totalUsdt },
          },
          create: {
            userId: to.id,
            total: fromBank.total,
            totalUsdt: fromBank.totalUsdt,
          },
        });
      }
    },
    // Neon over the network can be slow; the default 5s limit is too tight
    { timeout: 60_000, maxWait: 10_000 },
  );

  console.log(
    `\nDone. Data copied to ${to.email}; ${from.email} is unchanged.`,
  );
}

main()
  .catch((error) => {
    // Prisma errors carry a code (e.g. ETIMEDOUT) that is not in the message,
    // so log them whole; the script's own errors only need their message
    console.error(
      error instanceof Error && !("code" in error) ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
