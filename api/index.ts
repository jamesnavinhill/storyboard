import { getConfig } from "../server/config";
import { initializeDatabase } from "../server/database";
import { createApp } from "../server/app";

// Cache the app instance for re-use in the same serverless container
let app: any;

export default async function handler(req: any, res: any) {
    if (!app) {
        const config = getConfig();
        const db = await initializeDatabase();
        app = createApp(db, config);
    }

    // Handle the request
    return app(req, res);
}
