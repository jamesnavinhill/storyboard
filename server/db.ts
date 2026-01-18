/**
 * Database Module
 *
 * Provides database access for the application.
 * - Local development: Uses better-sqlite3 (synchronous)
 * - Vercel deployment: Uses PostgreSQL via pg (requires async refactoring)
 *
 * For the initial Vercel deployment, we keep SQLite as the primary database
 * since Vercel supports SQLite via their edge runtime. Full PostgreSQL
 * migration can be done incrementally.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getConfig } from "./config";

const config = getConfig();

const dbDirectory = path.dirname(config.dbPath);
fs.mkdirSync(dbDirectory, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

export type SqliteDatabase = typeof db;
