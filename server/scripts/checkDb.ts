#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { db } from "../db";
import { runMigrations } from "../migrations/runMigrations";
import { getConfig } from "../config";

const REQUIRED_TABLES = [
  "projects",
  "scenes",
  "assets",
  "chat_messages",
  "settings",
  "__migrations",
];

const verifyTables = () => {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all({}) as Array<{ name: string }>;
  const present = new Set(rows.map((row) => row.name));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Missing required tables: ${missing
        .map((name) => `"${name}"`)
        .join(", ")}`
    );
  }
};

const verifyAssetsDir = (dataDir: string) => {
  const assetsDir = path.join(dataDir, "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.accessSync(assetsDir, fs.constants.W_OK | fs.constants.R_OK);
};

const main = () => {
  runMigrations(db);
  verifyTables();
  const config = getConfig();
  verifyAssetsDir(config.dataDir);
  // eslint-disable-next-line no-console
  console.log(
    `Database ready at ${config.dbPath} and assets directory ${path.join(
      config.dataDir,
      "assets"
    )} is writable.`
  );
};

main();
