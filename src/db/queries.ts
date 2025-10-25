import { type UUID, randomUUID } from "crypto";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export const insertUser = async (db: BunSQLiteDatabase, email: string, password: string) => {
  const passwordHash = await Bun.password.hash(password);
  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      email,
      passwordHash,
    })
    .returning({ id: users.id });
  return user.id;
};

export const getUserByEmail = (db: BunSQLiteDatabase, email: string) => {
  const user = db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.email, email)).get();
  return user;
};

export const getUserById = (db: BunSQLiteDatabase, id: string) => {
  const user = db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id)).get();
  return user;
};
