import { getConfig } from "../server/config";
import { initializeDatabase } from "../server/database";
import { createApp } from "../server/app";
import { runMigrations } from "../server/migrations/runMigrations";
import { seedDefaultData } from "../server/seeds/defaultData";

// Cache the app instance for re-use in the same serverless container
let app: any;

export default async function handler(req: any, res: any) {
    if (!app) {
        const config = getConfig();
        const db = await initializeDatabase();

        // Ensure migrations run (even for Turso/Postgres in serverless)
        const sqliteDb = db.getSqliteDb();
        if (sqliteDb) {
            runMigrations(sqliteDb);
        }

        // Auto-seed default data if missing
        await seedDefaultData(db);

        app = createApp(db, config);
    }

    // Handle the request
    return app(req, res);
}
