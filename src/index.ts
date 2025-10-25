import { Hono } from "hono";
import { db } from "./db/db";
import { signupValidator } from "./schemas/signup-schema";
import { getUserByEmail, getUserById, insertUser } from "./db/queries";
import { cookieOpts, generateAccessToken, generateRefreshToken } from "./helpers";
import { deleteCookie, setCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import { jwt } from "hono/jwt";

const app = new Hono();

app
  .use("/api/refresh", jwt({ secret: process.env.REFRESH_TOKEN_SECRET!, cookie: "refreshToken" }))
  .use("/api/auth/*", jwt({ secret: process.env.ACCESS_TOKEN_SECRET!, cookie: "accessToken" }))
  .use("/api/*", csrf())
  .post("/api/signup", signupValidator, async (c) => {
    const { email, password } = c.req.valid("json");
    try {
      const userId = await insertUser(db, email, password);
      const accessToken = await generateAccessToken(userId); // 15 minutes
      const refreshToken = await generateRefreshToken(userId); // 7 days
      setCookie(c, "refreshToken", refreshToken, cookieOpts);
      return c.json({ accessToken, message: "User registered successfully", user: { id: userId, email } });
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        return c.json({ errors: ["Email already in use"] }, 409);
      }
      console.error("Signup error:", error);
      return c.json({ errors: ["Internal Server Error"] }, 500);
    }
  })
  .post("/api/login", signupValidator, async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const user = getUserByEmail(db, email);
      if (!user) {
        return c.json({ errors: ["Invalid credentials"] }, 401);
      }

      const passwordMatch = await Bun.password.verify(password, user.passwordHash);
      if (!passwordMatch) {
        return c.json({ errors: ["Invalid credentials"] }, 401);
      }

      const accessToken = await generateAccessToken(user.id); // 15 minutes
      const refreshToken = await generateRefreshToken(user.id); // 7 days
      setCookie(c, "refreshToken", refreshToken, cookieOpts);
      return c.json({ accessToken, message: "Login successful", user: { id: user.id, email } });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ errors: ["Internal Server Error"] }, 500);
    }
  })
  .post("/api/refresh", async (c) => {
    const payload = c.get("jwtPayload");
    try {
      const user = getUserById(db, payload.sub);
      if (!user) {
        return c.json({ errors: ["User not found"] }, 404);
      }
      const newAccessToken = await generateAccessToken(user.id); // 15 minutes
      const newRefreshToken = await generateRefreshToken(user.id); // 7 days
      setCookie(c, "refreshToken", newRefreshToken, cookieOpts);
      return c.json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Error refreshing token:", error);
      return c.json({ errors: ["Internal Server Error"] }, 500);
    }
  })
  .post("/api/logout", (c) => {
    deleteCookie(c, "refreshToken", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    return c.json({ message: "Logged out successfully" });
  })
  .get("/api/auth/me", async (c) => {
    const payload = c.get("jwtPayload");
    try {
      const user = getUserById(db, payload.sub);
      if (!user) {
        return c.json({ errors: ["User not found"] }, 404);
      }
      return c.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Error fetching user:", error);
      return c.json({ errors: ["Internal Server Error"] }, 500);
    }
  });

export default app;
