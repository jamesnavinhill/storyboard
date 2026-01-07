import fs from "node:fs";
import path from "node:path";
import type { Database as SqliteDatabase } from "better-sqlite3";

const MIGRATIONS_TABLE = "__migrations";

export const runMigrations = (db: SqliteDatabase, migrationsDir?: string) => {
  const resolvedDir =
    migrationsDir ?? path.resolve(process.cwd(), "server", "migrations");
  if (!fs.existsSync(resolvedDir)) {
    return;
  }

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  ).run();

  const appliedRows = db
    .prepare(`SELECT id FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`)
    .all({}) as Array<{ id: string }>;
  const appliedMigrations = new Set<string>(appliedRows.map((row) => row.id));

  const migrationFiles = fs
    .readdirSync(resolvedDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    if (appliedMigrations.has(file)) {
      continue;
    }
    const filePath = path.join(resolvedDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare(`INSERT INTO ${MIGRATIONS_TABLE} (id) VALUES (?)`).run(file);
      db.exec("COMMIT");
      // eslint-disable-next-line no-console
      console.info(`Applied migration ${file}`);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
};
