import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createLogger } from "../dist/src/logger.js";

test("disabled file logging still writes to the terminal without creating a file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "numbergoup-logs-"));
  const path = join(directory, "logs", "server.log");
  const previousInfo = console.info;
  const output = [];
  console.info = (line) => output.push(line);
  try {
    await createLogger(false, path).info("market started");
    assert.match(output[0], /INFO market started/);
    await assert.rejects(readFile(path), { code: "ENOENT" });
  } finally {
    console.info = previousInfo;
    await rm(directory, { recursive: true, force: true });
  }
});

test("enabled file logging persists the same concise terminal message", async () => {
  const directory = await mkdtemp(join(tmpdir(), "numbergoup-logs-"));
  const path = join(directory, "logs", "server.log");
  const previousError = console.error;
  const output = [];
  console.error = (line) => output.push(line);
  try {
    await createLogger(true, path).error("state unavailable");
    const contents = await readFile(path, "utf8");
    assert.match(output[0], /ERROR state unavailable/);
    assert.equal(contents.trim(), output[0]);
  } finally {
    console.error = previousError;
    await rm(directory, { recursive: true, force: true });
  }
});
