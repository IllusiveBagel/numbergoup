import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createInitialState } from "../dist/src/market.js";
import { loadState, saveState } from "../dist/src/persistence.js";

test("persists compact game state and starts a new game when no save exists", async () => {
  const directory = await mkdtemp(join(tmpdir(), "numbergoup-"));
  const path = join(directory, "nested", "market.json");
  try {
    const fresh = await loadState(path);
    assert.equal(fresh.cash, 10_000);

    const saved = createInitialState();
    saved.cash = 4321;
    await saveState(path, saved);
    const loaded = await loadState(path);

    assert.equal(loaded.cash, 4321);
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), saved);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
