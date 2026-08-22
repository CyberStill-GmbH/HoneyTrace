import { Pool } from "pg";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { PgRepository } from "./db/repository.js";

const pool = new Pool({ connectionString: config.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });
const app = createApp(new PgRepository(pool));
app.listen(config.PORT, "0.0.0.0", () => console.log(`visualizer-api listening on ${config.PORT}`));
process.on("SIGTERM", async () => { await pool.end(); process.exit(0); });
