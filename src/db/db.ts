import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = join(".", "db.sqlite");

let db: Database;

export const dbConn = (): Database => {
  if (!db) {
    db = new Database(dbPath);
    db.run("PRAGMA journal_mode = WAL;");

    applySchema(db);
  }
  return db;
};

export const applySchema = (dbInstance: Database) => {
  dbInstance.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    favorite_color TEXT,
    favorite_animal TEXT
  );
  `);
};
