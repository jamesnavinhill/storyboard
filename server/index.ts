import { getConfig } from "./config";
import { initializeDatabase } from "./database";
import { runMigrations } from "./migrations/runMigrations";
import { createApp } from "./app";

const startServer = async () => {
  const config = getConfig();
  
  // Initialize the unified database (SQLite, Turso, or PostgreSQL)
  const db = await initializeDatabase();
  
  // Run migrations (only for SQLite - Turso/Postgres migrations are run manually)
  const sqliteDb = db.getSqliteDb();
  if (sqliteDb) {
    runMigrations(sqliteDb);
  }

  const app = createApp(db, config);

  const port = config.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
