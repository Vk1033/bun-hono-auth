import "dotenv/config";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const sqlite = new Database(process.env.DB_FILE_NAME!);

sqlite.run("PRAGMA journal_mode = WAL;");

export const db = drizzle({ client: sqlite });
