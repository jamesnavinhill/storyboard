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
