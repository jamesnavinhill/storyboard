import { getConfig } from "./config";
import { db } from "./db";
import { runMigrations } from "./migrations/runMigrations";
import { createApp } from "./app";

const config = getConfig();
runMigrations(db);

const app = createApp(db, config);

const port = config.port;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});

export default app;
