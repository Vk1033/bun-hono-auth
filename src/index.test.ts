import app from ".";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { createTestDb } from "./test/test-db";
import { Database } from "bun:sqlite";
import { authReq, loginReq, logoutReq, refreshReq, signupReq } from "./test/test-helpers";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

let db: BunSQLiteDatabase;
let sqlite: Database;

beforeEach(() => {
  ({ sqlite, db } = createTestDb());
  mock.module("../src/db/db.ts", () => {
    return { db };
  });
});

afterEach(() => {
  sqlite.close();
});

describe("signup endpoint", () => {
  it("should register a new user successfully", async () => {
    const req = signupReq();
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      accessToken: expect.any(String),
      message: "User registered successfully",
      user: { id: expect.any(String), email: "test@test.com" },
    });

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toMatch(/refreshToken=/);
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
      accessToken: expect.any(String),
      message: "Login successful",
      user: { id: expect.any(String), email: "test@test.com" },
    });

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toMatch(/refreshToken=/);
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

describe("logout endpoint", () => {
  it("should logout successfully", async () => {
    const req = logoutReq();
    const res = await app.fetch(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({
      message: "Logged out successfully",
    });

    const cookies = res.headers.get("set-cookie");
    expect(cookies).toMatch(/refreshToken=;/);
  });
});

describe("refresh endpoint", () => {
  beforeEach(async () => {
    const req = signupReq();
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
  });

  it("should refresh tokens successfully", async () => {
    const loginResponse = await app.fetch(loginReq());
    expect(loginResponse.status).toBe(200);
    const refreshTokenCookie = loginResponse.headers.get("set-cookie")!.split(";")[0];

    const rReq = refreshReq(refreshTokenCookie);

    const refreshRes = await app.fetch(rReq);
    const json = await refreshRes.json();
    expect(refreshRes.status).toBe(200);

    expect(json).toEqual({
      accessToken: expect.any(String),
    });
  });

  it("should return 401 for invalid refresh token", async () => {
    const fakeRefreshTokenCookie = "refreshToken=invalid.token.here";
    const rReq = refreshReq(fakeRefreshTokenCookie);

    const refreshRes = await app.fetch(rReq);
    expect(refreshRes.status).toBe(401);
    expect(await refreshRes.text()).toBe("Unauthorized");
  });
});

describe("auth/me endpoint", () => {
  let accessToken: string;

  beforeEach(async () => {
    const req = signupReq();
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    accessToken = json.accessToken;
  });

  it("should get current user successfully", async () => {
    const req = authReq(accessToken);
    const res = await app.fetch(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      user: { id: expect.any(String), email: "test@test.com" },
    });
  });

  it("should return 401 for missing/invalid access token", async () => {
    const req = authReq("invalid.token.here");
    const res = await app.fetch(req);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });
});
