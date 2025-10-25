import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { insertUser, getUserByEmail, getUserById } from "./queries";
import { createTestDb } from "../test/test-db";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

let db: BunSQLiteDatabase;
let sqlite: Database;
beforeEach(() => {
  ({ sqlite, db } = createTestDb());
});

afterEach(() => {
  sqlite.close();
});

describe("insertUser", () => {
  it("should insert a user into db", async () => {
    const email = "test@test.com";
    const password = "test@123";
    const userId = await insertUser(db, email, password);
    expect(userId).toBeDefined();
  });

  it("should not allow duplicate emails", async () => {
    const email = "test@test.com";
    const password = "test@123";
    await insertUser(db, email, password);
    try {
      await insertUser(db, email, password);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/UNIQUE constraint failed/);
    }
  });

  it("should throw error if password is empty", async () => {
    const email = "test@test.com";
    try {
      await insertUser(db, email, "");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/password must not be empty/);
    }
  });
});

describe("getUserByEmail", () => {
  it("should retrieve a user by email", async () => {
    const email = "test@test.com";
    const password = "test@123";
    const userId = await insertUser(db, email, password);
    const user = getUserByEmail(db, email);
    expect(user).toBeDefined();
    expect(user!.id).toBe(userId);
    expect(user!.passwordHash).toBeDefined();
  });

  it("should return null for non-existing email", () => {
    const user = getUserByEmail(db, "nonexistent@test.com");
    expect(user).toBeUndefined();
  });
});

describe("getUserById", () => {
  it("should retrieve a user by ID", async () => {
    const email = "test@test.com";
    const password = "test@123";
    const userId = await insertUser(db, email, password);
    const user = getUserById(db, userId);
    expect(user).toBeDefined();
    expect(user!.id).toBe(userId);
    expect(user!.email).toBe(email);
  });

  it("should return null for non-existing ID", () => {
    const user = getUserById(db, "nonexistent-id");
    expect(user).toBeUndefined();
  });
});
