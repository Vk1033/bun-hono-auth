import { BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

export const createTestDb = (): { sqlite: Database; db: BunSQLiteDatabase } => {
  const sqlite = new Database(":memory:");
  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    favorite_color TEXT,
    favorite_animal TEXT
  );
  `);
  const db = drizzle({ client: sqlite });
  return { sqlite, db };
};
