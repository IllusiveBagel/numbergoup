import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export function createLogger(enabled: boolean, filePath: string) {
  return {
    info(message: string): Promise<void> {
      return log("INFO", message);
    },
    error(message: string): Promise<void> {
      return log("ERROR", message);
    },
  };

  function log(level: "INFO" | "ERROR", message: string): Promise<void> {
    const line = `${new Date().toISOString()} ${level} ${message}`;
    if (level === "ERROR") console.error(line);
    else console.info(line);
    return enabled ? write(line) : Promise.resolve();
  }

  async function write(line: string): Promise<void> {
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await appendFile(filePath, `${line}\n`, "utf8");
    } catch (error) {
      console.error(`Unable to write log file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
