import {
  APICallError,
  wrapLanguageModel,
  type LanguageModelMiddleware,
} from "ai";
import { google } from "@ai-sdk/google";

// Flash-Lite answers the CRM questions (one or two tool calls and a short
// summary) as accurately as Flash and in ~2 s, while Flash often stalls or
// returns 503 when Google is under load. Override with ASSISTANT_MODEL and
// ASSISTANT_FALLBACK_MODELS (comma-separated)
const PRIMARY_MODEL = process.env.ASSISTANT_MODEL ?? "gemini-flash-lite-latest";
const FALLBACK_MODELS = (
  process.env.ASSISTANT_FALLBACK_MODELS ??
  "gemini-3.5-flash-lite,gemini-flash-latest"
)
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id && id !== PRIMARY_MODEL);

// How long a model gets to start streaming before the next one is tried; a
// healthy Flash-Lite starts in 1-3 s, an overloaded model can hang for 60 s.
// The last model gets longer, then the user is told to retry
const START_TIMEOUT_MS = 7_000;
const LAST_START_TIMEOUT_MS = 15_000;

type StreamParams = Parameters<
  NonNullable<LanguageModelMiddleware["wrapStream"]>
>[0]["params"];

export class StartTimeoutError extends Error {
  constructor(modelId: string, timeoutMs: number) {
    super(`${modelId} did not start answering in ${timeoutMs} ms`);
  }
}

// Overload, quota (each model has its own), server errors and stalls move on
// to the next model; other 4xx are request bugs and would fail on every model
function isWorthFallingBack(error: unknown) {
  if (error instanceof StartTimeoutError) return true;
  if (!APICallError.isInstance(error)) return true; // network failure
  const status = error.statusCode;
  return (
    status === undefined || status === 408 || status === 429 || status >= 500
  );
}

async function streamWithin(
  modelId: string,
  params: StreamParams,
  timeoutMs: number,
) {
  const model = google(modelId);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new StartTimeoutError(modelId, timeoutMs)),
    timeoutMs,
  );
  const abortSignal = params.abortSignal
    ? AbortSignal.any([params.abortSignal, controller.signal])
    : controller.signal;
  try {
    return await model.doStream({ ...params, abortSignal });
  } catch (error) {
    throw controller.signal.aborted ? controller.signal.reason : error;
  } finally {
    // Once streaming has started the answer may take as long as it needs
    clearTimeout(timer);
  }
}

// Each step of the answer (tool call, final text) tries the models in order
export function assistantModel() {
  const chain = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  return wrapLanguageModel({
    model: google(PRIMARY_MODEL),
    middleware: {
      specificationVersion: "v4",
      wrapStream: async ({ params }) => {
        let lastError: unknown;
        for (const [index, modelId] of chain.entries()) {
          const isLast = index === chain.length - 1;
          try {
            return await streamWithin(
              modelId,
              params,
              isLast ? LAST_START_TIMEOUT_MS : START_TIMEOUT_MS,
            );
          } catch (error) {
            // The user closed the chat or the request ended: stop here
            if (params.abortSignal?.aborted) throw error;
            if (!isWorthFallingBack(error)) throw error;
            lastError = error;
            if (!isLast) {
              const reason = APICallError.isInstance(error)
                ? `HTTP ${error.statusCode}`
                : error instanceof Error
                  ? error.message
                  : "unknown error";
              console.warn(
                `Assistant model ${modelId} failed (${reason}); trying ${chain[index + 1]}`,
              );
            }
          }
        }
        throw lastError;
      },
    },
  });
}
