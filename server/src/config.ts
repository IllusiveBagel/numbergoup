function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveInteger(process.env.PORT, 3000),
  simulationIntervalMs: positiveInteger(process.env.SIMULATION_INTERVAL_MS, 1_000),
  dataDirectory: process.env.DATA_DIR || "./data",
  logToFile: process.env.LOG_TO_FILE === "true",
};
