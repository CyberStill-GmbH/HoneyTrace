import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { config } from "../config.js";

const pool = new Pool({ connectionString: config.DATABASE_URL });
const sql = await readFile(new URL("../../db/001_initial.sql", import.meta.url), "utf8");
await pool.query(sql); await pool.end(); console.log("visualizer database migrated");
