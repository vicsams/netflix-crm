// Runs every assistant tool for one user and checks the privacy boundary:
// no password or PIN field anywhere in a tool output, and no phone number or
// account email in what Gemini receives (toModelOutput), including after a
// saved conversation is converted back into model messages.
//
//   bun scripts/assistant-tools-check.ts <user-email>          (counts only)
//   bun scripts/assistant-tools-check.ts <user-email> --show   (also print rows)
//
// Read-only: it only runs SELECT queries.
import net from "net";
import { convertToModelMessages, type UIMessage } from "ai";
import prisma from "@/shared/lib/db";
import { createAssistantTools } from "@/features/assistant/server/tools";

// Under Bun, `pg` times out connecting to Neon unless addresses are tried one
// at a time (see scripts/copy-user-data.ts)
net.setDefaultAutoSelectFamily(false);

const [email] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const show = process.argv.includes("--show");

if (!email) {
  console.error(
    "Usage: bun scripts/assistant-tools-check.ts <user-email> [--show]",
  );
  process.exit(1);
}

// Sample inputs that exercise each tool's filters
const SAMPLES: Record<string, Record<string, unknown>[]> = {
  buscarSuscripciones: [
    {},
    { servicio: "netflix" },
    { estado: "POR_VENCER" },
    { venceEnDias: 7 },
  ],
  listarClientes: [{}, { conSuscripcionActiva: false }],
  listarCuentas: [{}, { soloConPantallasLibres: true }],
  listarServicios: [{}],
  resumenGanancias: [{}],
  listarRetiros: [{}, { moneda: "USDT" }],
};

const failures: string[] = [];

function findKeys(value: unknown, keys: string[], path = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findKeys(item, keys, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [
      ...(keys.includes(key) ? [`${path}.${key}`] : []),
      ...findKeys(child, keys, `${path}.${key}`),
    ]);
  }
  return [];
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const tools = createAssistantTools(user.id);

  // Every phone number and account email this user has; none may reach Gemini
  const [clients, accounts] = await Promise.all([
    prisma.client.findMany({
      where: { userId: user.id },
      select: { phoneNumber: true },
    }),
    prisma.activeAccount.findMany({
      where: { userId: user.id },
      select: { email: true },
    }),
  ]);
  const secrets = [
    ...clients.map((client) => client.phoneNumber),
    ...accounts.map((account) => account.email),
  ].filter((value) => value.trim().length >= 4);

  const uiParts: UIMessage["parts"] = [];

  for (const [name, inputs] of Object.entries(SAMPLES)) {
    const t = tools[name as keyof typeof tools];
    for (const input of inputs) {
      const label = `${name}(${JSON.stringify(input)})`;
      const output = await t.execute!(
        input as never,
        {
          toolCallId: `check-${uiParts.length}`,
          messages: [],
          context: {},
        } as never,
      );

      const forbidden = findKeys(output, ["password", "profilePIN"]);
      if (forbidden.length)
        failures.push(`${label}: forbidden fields ${forbidden.join(", ")}`);

      const modelOutput = t.toModelOutput
        ? await t.toModelOutput({
            toolCallId: "check",
            input: input as never,
            output: output as never,
          })
        : { type: "json", value: output };
      const modelText = JSON.stringify(modelOutput);
      const leaked = secrets.filter((secret) => modelText.includes(secret));
      if (leaked.length)
        failures.push(
          `${label}: ${leaked.length} phone/email value(s) in model output`,
        );

      const total = (output as { total?: number }).total;
      const rows = (output as { rows?: unknown[] }).rows;
      console.log(
        `${label}: total=${total ?? "-"} rows=${rows?.length ?? "-"} modelChars=${modelText.length}`,
      );
      if (show) console.dir(output, { depth: 4 });

      uiParts.push({
        type: `tool-${name}`,
        toolCallId: `check-${uiParts.length}`,
        state: "output-available",
        input,
        output,
      } as UIMessage["parts"][number]);
    }
  }

  // A saved assistant message, as reloaded from the database, must also be
  // summarized: convertToModelMessages applies toModelOutput only with `tools`
  const history = await convertToModelMessages(
    [{ role: "assistant", parts: uiParts }],
    { tools },
  );
  const historyText = JSON.stringify(history);
  const leakedInHistory = secrets.filter((secret) =>
    historyText.includes(secret),
  );
  if (leakedInHistory.length) {
    failures.push(
      `history: ${leakedInHistory.length} phone/email value(s) reach the model`,
    );
  }
  console.log(
    `history: ${history.length} model message(s), ${historyText.length} chars`,
  );

  if (failures.length) {
    console.error(`\nFAILED (${failures.length}):`);
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(
      `\nOK: ${secrets.length} phone numbers/emails checked, none reach the model`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
