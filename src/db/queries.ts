import { Database } from "bun:sqlite";
import { type UUID, randomUUID } from "crypto";

export const insertUser = async (db: Database, email: string, password: string) => {
  const passwordHash = await Bun.password.hash(password);
  const insertQuery = db.query(
    `INSERT INTO users (id, email, password_hash)
     VALUES (?, ?, ?)
     RETURNING id;`
  );
  const user = insertQuery.get(randomUUID(), email, passwordHash) as { id: UUID };
  return user.id;
};

export const getUserByEmail = (db: Database, email: string) => {
  const selectQuery = db.query(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = ?;`
  );
  const user = selectQuery.get(email) as { id: UUID; password_hash: string } | null;
  return user;
};
