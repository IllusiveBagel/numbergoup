import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { MarketError, type MarketEngine } from "./market.js";
import type { TradeSide } from "./types.js";

const MAX_BODY_BYTES = 16 * 1024;

class RequestError extends Error {}

export function createApiServer(
  market: MarketEngine,
  onTrade: () => Promise<void>,
  onError: (message: string) => void,
) {
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (request.method === "GET" && path === "/api/health") {
        sendJson(response, 200, { status: "ok" });
      } else if (request.method === "GET" && path === "/api/state") {
        sendJson(response, 200, market.snapshot());
      } else if (request.method === "POST" && path === "/api/trade") {
        const body = await readJson(request);
        if (typeof body !== "object" || body === null) throw new RequestError("Invalid order.");
        const order = body as { symbol?: unknown; side?: unknown; shares?: unknown };
        if (typeof order.symbol !== "string" || typeof order.side !== "string" || typeof order.shares !== "number") {
          throw new RequestError("Provide a symbol, side, and number of shares.");
        }
        const trade = market.trade(order.symbol, order.side as TradeSide, order.shares);
        await onTrade();
        sendJson(response, 200, { trade, state: market.snapshot() });
      } else {
        sendJson(response, 404, { error: "Not found." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed.";
      if (message === "Request body is too large.") {
        sendJson(response, 413, { error: message });
      } else if (error instanceof SyntaxError || error instanceof RequestError || error instanceof MarketError) {
        sendJson(response, 400, { error: message });
      } else {
        onError(message);
        sendJson(response, 500, { error: "The market could not complete that request." });
      }
    }
  });
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
