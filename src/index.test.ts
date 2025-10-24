import app from ".";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { createTestDb } from "./test/test-db";
import { Database } from "bun:sqlite";
import { loginReq, signupReq } from "./test/test-helpers";

let db: Database;

mock.module("../src/db/db.ts", () => {
  return {
    dbConn: () => db,
  };
});

beforeEach(() => {
  db = createTestDb();
});

afterEach(() => {
  db.close();
});

describe("signup endpoint", () => {
  it("should register a new user successfully", async () => {
    const req = signupReq();
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "User registered successfully",
      user: { id: expect.any(String), email: "test@test.com" },
    });

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toMatch(/authToken=/);
  });

  it("should return 409 for duplicate email", async () => {
    const req1 = signupReq();
    const res1 = await app.fetch(req1);
    expect(res1.status).toBe(200);

    const req2 = signupReq();
    const res2 = await app.fetch(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(409);
    expect(json2).toEqual({
      errors: ["Email already in use"],
    });
  });

  it("should return error if email or password is missing", async () => {
    const req = signupReq("", "");
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      errors: ["Invalid email address", "Password must be at least 8 characters long"],
    });
  });
});

describe("login endpoint", () => {
  beforeEach(async () => {
    const req = signupReq();
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });

  it("should login successfully with correct credentials", async () => {
    const req = loginReq();
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "Login successful",
      user: { id: expect.any(String), email: "test@test.com" },
    });

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toMatch(/authToken=/);
  });

  it("return 400 for missing email or password", async () => {
    const req = loginReq("", "");
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      errors: ["Invalid email address", "Password must be at least 8 characters long"],
    });
  });

  it("should return 401 for invalid credentials", async () => {
    const req = loginReq("test@test.com", "wrongpassword");
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({
      errors: ["Invalid credentials"],
    });
  });
});
