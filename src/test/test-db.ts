import { Database } from "bun:sqlite";
import app from "..";
import { applySchema } from "../db/db";

export const createTestDb = (): Database => {
  const db = new Database(":memory:");
  db.run("PRAGMA journal_mode = WAL;");
  applySchema(db);
  return db;
};
