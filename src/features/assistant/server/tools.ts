import { tool } from "ai";
import * as z from "zod";
import {
  addDays,
  format,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns";
import prisma from "@/shared/lib/db";
import { getDerivedStatus } from "@/features/subscriptions/lib/status";

// Read-only CRM queries the assistant can call. Every query is scoped to the
// signed-in user (userId comes from the request, never from the model) and
// selects only the fields it needs: account passwords and screen PINs are
// never read.
//
// Each tool returns full rows for the chat's tables, and a smaller
// `toModelOutput` summary for Gemini, without phone numbers or emails.
//
// Server only (it queries the database): client code may only `import type`.

type DerivedStatus = ReturnType<typeof getDerivedStatus>;

const STATUS_LABEL: Record<DerivedStatus, string> = {
  ACTIVE: "Activo",
  NEAR_EXPIRATION: "Cerca de expirar",
  EXPIRED: "Expirado",
};

const STATUS_FILTER = {
  ACTIVA: "ACTIVE",
  POR_VENCER: "NEAR_EXPIRATION",
  VENCIDA: "EXPIRED",
} as const satisfies Record<string, DerivedStatus>;

// The model only needs a sample to summarize; the table shows every row
const MODEL_ROW_LIMIT = 50;

const contains = (value: string) => ({
  contains: value.trim(),
  mode: "insensitive" as const,
});

const toDay = (date: Date | null) => (date ? format(date, "yyyy-MM-dd") : null);

const fromCents = (cents: number | null) =>
  cents === null ? null : cents / 100;

// Dates come from the model as "AAAA-MM-DD"; reject anything else so it can
// retry with a valid one instead of silently querying the wrong range
function parseDay(value: string | undefined, field: string) {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  if (!isValid(date)) {
    throw new Error(`"${field}" debe tener el formato AAAA-MM-DD`);
  }
  return startOfDay(date);
}

// Inclusive day range, defaulting to the current month so far. Uses the
// server's timezone (UTC on Vercel), so day edges can be off by a few hours
function dayRange(desde?: string, hasta?: string) {
  const from = parseDay(desde, "desde") ?? startOfMonth(new Date());
  const to = parseDay(hasta, "hasta") ?? startOfDay(new Date());
  return { from, to, toExclusive: addDays(to, 1) };
}

const dateRangeInput = {
  desde: z
    .string()
    .optional()
    .describe(
      "Fecha inicial AAAA-MM-DD, inclusiva. Por defecto: inicio del mes actual.",
    ),
  hasta: z
    .string()
    .optional()
    .describe("Fecha final AAAA-MM-DD, inclusiva. Por defecto: hoy."),
};

const limitInput = (max: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`Máximo de filas a devolver (1-${max}).`);

async function availableServiceNames(userId: string) {
  const services = await prisma.service.findMany({
    where: { createdById: userId },
    select: { serviceName: true },
    orderBy: { serviceName: "asc" },
  });
  return services.map((service) => service.serviceName);
}

export function createAssistantTools(userId: string) {
  return {
    buscarSuscripciones: tool({
      description:
        "Busca suscripciones de clientes. Úsala para preguntas sobre quién tiene un servicio, qué vence pronto, suscripciones activas o vencidas, o las de un cliente o cuenta.",
      inputSchema: z.object({
        servicio: z
          .string()
          .optional()
          .describe('Nombre del servicio, búsqueda parcial (ej. "netflix").'),
        cliente: z
          .string()
          .optional()
          .describe("Nombre del cliente, búsqueda parcial."),
        correoCuenta: z
          .string()
          .optional()
          .describe("Correo de la cuenta de streaming, búsqueda parcial."),
        estado: z
          .enum(["ACTIVA", "POR_VENCER", "VENCIDA", "TODAS"])
          .optional()
          .describe(
            "ACTIVA, POR_VENCER (vence en 3 días o menos) o VENCIDA. Por defecto TODAS.",
          ),
        venceEnDias: z
          .number()
          .int()
          .min(0)
          .max(365)
          .optional()
          .describe("Solo las que vencen desde hoy hasta dentro de N días."),
        limite: limitInput(200),
      }),
      execute: async ({
        servicio,
        cliente,
        correoCuenta,
        estado,
        venceEnDias,
        limite,
      }) => {
        const subscriptions = await prisma.subscription.findMany({
          where: {
            userId,
            ...(servicio && { service: { serviceName: contains(servicio) } }),
            ...(cliente && { client: { clientName: contains(cliente) } }),
            ...(correoCuenta && {
              activeAccount: { email: contains(correoCuenta) },
            }),
          },
          select: {
            id: true,
            status: true,
            expirationDate: true,
            purchaseDate: true,
            amount: true,
            client: { select: { clientName: true, phoneNumber: true } },
            service: { select: { serviceName: true } },
            activeAccount: { select: { email: true } },
            screen: { select: { profileName: true } },
          },
          orderBy: { expirationDate: { sort: "asc", nulls: "last" } },
        });

        const today = startOfDay(new Date());
        const horizon =
          venceEnDias === undefined ? null : addDays(today, venceEnDias + 1);

        const matching = subscriptions
          .map((subscription) => ({
            ...subscription,
            derived: getDerivedStatus(subscription),
          }))
          .filter(
            (subscription) =>
              !estado ||
              estado === "TODAS" ||
              subscription.derived === STATUS_FILTER[estado],
          )
          .filter(
            (subscription) =>
              !horizon ||
              (subscription.expirationDate !== null &&
                subscription.expirationDate >= today &&
                subscription.expirationDate < horizon),
          );

        const rows = matching.slice(0, limite ?? 100).map((subscription) => ({
          id: subscription.id,
          clientName: subscription.client.clientName,
          phoneNumber: subscription.client.phoneNumber,
          serviceName: subscription.service.serviceName,
          accountEmail: subscription.activeAccount.email,
          profileName: subscription.screen.profileName,
          purchaseDate: subscription.purchaseDate.toISOString(),
          expirationDate: subscription.expirationDate?.toISOString() ?? null,
          amountBs: fromCents(subscription.amount),
          status: subscription.derived,
        }));

        // An unknown service name usually means a typo: offer the real ones
        const availableServices =
          servicio && subscriptions.length === 0
            ? await availableServiceNames(userId)
            : undefined;

        return { total: matching.length, rows, availableServices };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: {
          total: output.total,
          mostradasEnTabla: output.rows.length,
          serviciosDisponibles: output.availableServices ?? null,
          filas: output.rows.slice(0, MODEL_ROW_LIMIT).map((row) => ({
            cliente: row.clientName,
            servicio: row.serviceName,
            estado: STATUS_LABEL[row.status],
            vence: row.expirationDate?.slice(0, 10) ?? null,
            compra: row.purchaseDate.slice(0, 10),
            montoBs: row.amountBs,
          })),
        },
      }),
    }),

    listarClientes: tool({
      description:
        "Lista clientes con su cantidad de suscripciones y los servicios que tienen. Úsala para preguntas sobre clientes (quiénes son, cuántas suscripciones tienen, quién no tiene ninguna activa).",
      inputSchema: z.object({
        nombre: z
          .string()
          .optional()
          .describe("Nombre del cliente, búsqueda parcial."),
        servicio: z
          .string()
          .optional()
          .describe("Solo clientes con alguna suscripción de este servicio."),
        conSuscripcionActiva: z
          .boolean()
          .optional()
          .describe(
            "true: solo clientes con alguna suscripción vigente; false: solo los que no tienen ninguna vigente.",
          ),
        limite: limitInput(200),
      }),
      execute: async ({ nombre, servicio, conSuscripcionActiva, limite }) => {
        const clients = await prisma.client.findMany({
          where: {
            userId,
            ...(nombre && { clientName: contains(nombre) }),
            ...(servicio && {
              subscriptions: {
                some: { service: { serviceName: contains(servicio) } },
              },
            }),
          },
          select: {
            id: true,
            clientName: true,
            phoneNumber: true,
            subscriptions: {
              select: {
                status: true,
                expirationDate: true,
                service: { select: { serviceName: true } },
              },
            },
          },
          orderBy: { clientName: "asc" },
        });

        const matching = clients
          .map((client) => {
            const activeCount = client.subscriptions.filter(
              (subscription) => getDerivedStatus(subscription) !== "EXPIRED",
            ).length;
            return {
              id: client.id,
              clientName: client.clientName,
              phoneNumber: client.phoneNumber,
              subscriptionCount: client.subscriptions.length,
              activeCount,
              services: [
                ...new Set(
                  client.subscriptions.map(
                    (subscription) => subscription.service.serviceName,
                  ),
                ),
              ],
            };
          })
          .filter(
            (client) =>
              conSuscripcionActiva === undefined ||
              client.activeCount > 0 === conSuscripcionActiva,
          );

        return {
          total: matching.length,
          rows: matching.slice(0, limite ?? 100),
        };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: {
          total: output.total,
          mostradosEnTabla: output.rows.length,
          filas: output.rows.slice(0, MODEL_ROW_LIMIT).map((row) => ({
            cliente: row.clientName,
            suscripciones: row.subscriptionCount,
            vigentes: row.activeCount,
            servicios: row.services,
          })),
        },
      }),
    }),

    listarCuentas: tool({
      description:
        "Lista las cuentas de streaming (correos) con su servicio, vencimiento y pantallas libres u ocupadas. Nunca devuelve contraseñas ni PINs.",
      inputSchema: z.object({
        servicio: z
          .string()
          .optional()
          .describe("Nombre del servicio, búsqueda parcial."),
        venceEnDias: z
          .number()
          .int()
          .min(0)
          .max(365)
          .optional()
          .describe(
            "Solo cuentas que vencen desde hoy hasta dentro de N días.",
          ),
        soloConPantallasLibres: z
          .boolean()
          .optional()
          .describe("true: solo cuentas con al menos una pantalla libre."),
      }),
      execute: async ({ servicio, venceEnDias, soloConPantallasLibres }) => {
        const accounts = await prisma.activeAccount.findMany({
          where: {
            userId,
            ...(servicio && { service: { serviceName: contains(servicio) } }),
          },
          select: {
            id: true,
            email: true,
            expirationDate: true,
            service: { select: { serviceName: true } },
            screens: {
              select: {
                profileName: true,
                subscriptions: {
                  select: { status: true, expirationDate: true },
                },
              },
            },
          },
          orderBy: { expirationDate: "asc" },
        });

        const today = startOfDay(new Date());
        const horizon =
          venceEnDias === undefined ? null : addDays(today, venceEnDias + 1);

        const rows = accounts
          .map((account) => {
            // A screen is taken while any of its subscriptions is still running
            const freeProfiles = account.screens
              .filter(
                (screen) =>
                  !screen.subscriptions.some(
                    (subscription) =>
                      getDerivedStatus(subscription) !== "EXPIRED",
                  ),
              )
              .map((screen) => screen.profileName);
            return {
              id: account.id,
              email: account.email,
              serviceName: account.service?.serviceName ?? null,
              expirationDate: account.expirationDate.toISOString(),
              screensTotal: account.screens.length,
              screensUsed: account.screens.length - freeProfiles.length,
              screensFree: freeProfiles.length,
              freeProfiles,
            };
          })
          .filter(
            (account) => !soloConPantallasLibres || account.screensFree > 0,
          )
          .filter((account) => {
            if (!horizon) return true;
            const expiration = new Date(account.expirationDate);
            return expiration >= today && expiration < horizon;
          });

        const availableServices =
          servicio && accounts.length === 0
            ? await availableServiceNames(userId)
            : undefined;

        return { total: rows.length, rows, availableServices };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: {
          total: output.total,
          serviciosDisponibles: output.availableServices ?? null,
          filas: output.rows.slice(0, MODEL_ROW_LIMIT).map((row) => ({
            servicio: row.serviceName,
            vence: row.expirationDate.slice(0, 10),
            pantallas: row.screensTotal,
            ocupadas: row.screensUsed,
            libres: row.screensFree,
          })),
        },
      }),
    }),

    listarServicios: tool({
      description:
        "Lista los servicios de streaming con su precio, cantidad de cuentas y suscripciones vigentes.",
      inputSchema: z.object({}),
      execute: async () => {
        const services = await prisma.service.findMany({
          where: { createdById: userId },
          select: {
            id: true,
            serviceName: true,
            price: true,
            currency: true,
            _count: { select: { activeAccounts: true } },
            subscriptions: {
              where: { userId },
              select: { status: true, expirationDate: true },
            },
          },
          orderBy: { serviceName: "asc" },
        });

        const rows = services.map((service) => ({
          id: service.id,
          serviceName: service.serviceName,
          price: service.price / 100,
          currency: service.currency,
          accounts: service._count.activeAccounts,
          activeSubscriptions: service.subscriptions.filter(
            (subscription) => getDerivedStatus(subscription) !== "EXPIRED",
          ).length,
        }));

        return { total: rows.length, rows };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: output.rows.map((row) => ({
          servicio: row.serviceName,
          precio: row.price,
          moneda: row.currency,
          cuentas: row.accounts,
          suscripcionesVigentes: row.activeSubscriptions,
        })),
      }),
    }),

    resumenGanancias: tool({
      description:
        "Resumen de dinero: saldo actual en banco (Bs) y Binance (USDT), y ventas de suscripciones en un rango de fechas, por servicio. Las ventas usan la fecha y el monto de la última compra o renovación de cada suscripción.",
      inputSchema: z.object(dateRangeInput),
      execute: async ({ desde, hasta }) => {
        const { from, to, toExclusive } = dayRange(desde, hasta);

        const [bank, sales, services] = await Promise.all([
          prisma.bankEarnings.findUnique({
            where: { userId },
            select: { total: true, totalUsdt: true },
          }),
          prisma.subscription.groupBy({
            by: ["serviceId"],
            where: {
              userId,
              amount: { not: null },
              purchaseDate: { gte: from, lt: toExclusive },
            },
            _sum: { amount: true },
            _count: { _all: true },
          }),
          prisma.service.findMany({
            where: { createdById: userId },
            select: { id: true, serviceName: true },
          }),
        ]);

        const serviceName = new Map(
          services.map((service) => [service.id, service.serviceName]),
        );
        const byService = sales
          .map((group) => ({
            serviceName: serviceName.get(group.serviceId) ?? "Sin servicio",
            totalBs: (group._sum.amount ?? 0) / 100,
            count: group._count._all,
          }))
          .sort((a, b) => b.totalBs - a.totalBs);

        return {
          desde: toDay(from)!,
          hasta: toDay(to)!,
          bankBs: (bank?.total ?? 0) / 100,
          bankUsdt: (bank?.totalUsdt ?? 0) / 100,
          salesBs: byService.reduce((sum, row) => sum + row.totalBs, 0),
          salesCount: byService.reduce((sum, row) => sum + row.count, 0),
          byService,
        };
      },
    }),

    listarRetiros: tool({
      description:
        "Lista los retiros de fondos (Bs o USDT) con su motivo, en un rango de fechas, y el total retirado por moneda.",
      inputSchema: z.object({
        moneda: z
          .enum(["BS", "USDT"])
          .optional()
          .describe("Filtrar por moneda."),
        ...dateRangeInput,
        limite: limitInput(200),
      }),
      execute: async ({ moneda, desde, hasta, limite }) => {
        const { from, to, toExclusive } = dayRange(desde, hasta);
        const where = {
          userId,
          ...(moneda && { currency: moneda }),
          createdAt: { gte: from, lt: toExclusive },
        };

        const [withdrawals, totals] = await Promise.all([
          prisma.bankWithdrawal.findMany({
            where,
            select: {
              id: true,
              currency: true,
              amount: true,
              reason: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: limite ?? 50,
          }),
          prisma.bankWithdrawal.groupBy({
            by: ["currency"],
            where,
            _sum: { amount: true },
            _count: { _all: true },
          }),
        ]);

        return {
          desde: toDay(from)!,
          hasta: toDay(to)!,
          total: totals.reduce((sum, group) => sum + group._count._all, 0),
          totalsByCurrency: totals.map((group) => ({
            currency: group.currency,
            amount: (group._sum.amount ?? 0) / 100,
            count: group._count._all,
          })),
          rows: withdrawals.map((withdrawal) => ({
            id: withdrawal.id,
            currency: withdrawal.currency,
            amount: withdrawal.amount / 100,
            reason: withdrawal.reason,
            createdAt: withdrawal.createdAt.toISOString(),
          })),
        };
      },
      toModelOutput: ({ output }) => ({
        type: "json",
        value: {
          desde: output.desde,
          hasta: output.hasta,
          total: output.total,
          totalesPorMoneda: output.totalsByCurrency,
          filas: output.rows.slice(0, MODEL_ROW_LIMIT).map((row) => ({
            fecha: row.createdAt.slice(0, 10),
            moneda: row.currency,
            monto: row.amount,
            motivo: row.reason,
          })),
        },
      }),
    }),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
