#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function collectPaths(value, found = []) {
  if (!value) return found;
  if (typeof value === "string") {
    if (
      (value.includes("/") || value.includes("\\")) &&
      /\.(ts|tsx|mts|js|mjs|json)$/.test(value)
    ) {
      found.push(value);
    }
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPaths(item, found);
    return found;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (/path|file|uri/i.test(key) || typeof nested === "object") {
        collectPaths(nested, found);
      }
    }
  }
  return found;
}

function shouldRun(input) {
  const paths = collectPaths(input);
  if (paths.length === 0) return true;

  return paths.some((filePath) => {
    const absolute = resolve(projectRoot, filePath);
    return (
      (absolute.includes(`${projectRoot}/ui/src/`) ||
        absolute.includes(`${projectRoot}/backend/src/`) ||
        absolute.includes(`${projectRoot}/shared/`) ||
        absolute.includes(`${projectRoot}/ui/vitest`)) &&
      !absolute.includes("/.cursor/") &&
      !absolute.includes("/node_modules/")
    );
  });
}

let input = {};
try {
  const raw = await new Promise((resolveInput, reject) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolveInput(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
  input = raw.trim() ? JSON.parse(raw) : {};
} catch {
  input = {};
}

if (!shouldRun(input)) {
  process.stdout.write("{}\n");
  process.exit(0);
}

if (!existsSync(resolve(projectRoot, "package.json"))) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const result = spawnSync("npm", ["run", "test:run"], {
  cwd: projectRoot,
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: "/tmp/npm-cache-luna" },
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
const passed = result.status === 0;
const summary =
  output
    .split("\n")
    .filter((line) => /Test Files|Tests |FAIL |PASS /.test(line))
    .slice(-8)
    .join("\n") || output.slice(-500);

process.stdout.write(
  `${JSON.stringify({
    additional_context: passed
      ? `Luna unit tests passed after this change.\n${summary}`
      : `Luna unit tests failed after this change. Fix the failing tests before continuing.\n${summary}`,
  })}\n`,
);

process.exit(0);
