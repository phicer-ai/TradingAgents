#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const generator = path.resolve(here, "../../../../shared/codegraph/generate-codegraph.mjs");

if (!fs.existsSync(generator)) {
  console.error("CodeGraph generator not found. Run this command from inside phicer-workspace with shared/codegraph available.");
  process.exit(1);
}

const { runCodegraphCli } = await import(pathToFileURL(generator).href);
const exitCode = await runCodegraphCli(process.argv.slice(2), process.cwd());
process.exit(exitCode);
