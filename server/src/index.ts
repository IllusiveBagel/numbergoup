import { join } from "node:path";
import { config } from "./config.js";
import { createApiServer } from "./http.js";
import { MarketEngine } from "./market.js";
import { createLogger } from "./logger.js";
import { loadState, saveState } from "./persistence.js";

const statePath = join(config.dataDirectory, "market.json");
const logger = createLogger(config.logToFile, join(config.dataDirectory, "logs", "server.log"));
const market = new MarketEngine(await loadState(statePath));
let saveInProgress = false;
let lastSavedAt = Date.now();

async function persistState(): Promise<void> {
  if (saveInProgress) return;
  saveInProgress = true;
  try {
    await saveState(statePath, market.persistedState());
    lastSavedAt = Date.now();
  } catch (error) {
    void logger.error(`Unable to save market state: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    saveInProgress = false;
  }
}

const server = createApiServer(market, persistState, (message) => {
  void logger.error(`API request failed: ${message}`);
});
server.listen(config.port, "0.0.0.0", () => {
  void logger.info(`Market API listening on port ${config.port}; file logging ${config.logToFile ? "enabled" : "disabled"}.`);
});

const simulationTimer = setInterval(() => {
  market.tick();
  if (Date.now() - lastSavedAt >= 60_000) void persistState();
}, config.simulationIntervalMs);

function shutdown(): void {
  clearInterval(simulationTimer);
  server.close(() => {
    void persistState().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
