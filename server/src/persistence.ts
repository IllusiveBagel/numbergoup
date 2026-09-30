import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createInitialState, restoreState } from "./market.js";
import type { PersistedState } from "./types.js";

export async function loadState(filePath: string): Promise<PersistedState> {
  try {
    const contents = await readFile(filePath, "utf8");
    return restoreState(JSON.parse(contents) as unknown);
  } catch (error) {
    if (isMissingFile(error)) return createInitialState();
    console.error(`Unable to load saved market; starting a new game: ${errorMessage(error)}`);
    return createInitialState();
  }
}

export async function saveState(filePath: string, state: PersistedState): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state), "utf8");
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
