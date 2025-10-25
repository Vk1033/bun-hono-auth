import { Hono } from "hono";
import { db } from "./db/db";
import { signupValidator } from "./schemas/signup-schema";
import { getUserByEmail, getUserById, insertUser } from "./db/queries";
import { cookieOpts, generateToken } from "./helpers";
import { deleteCookie, setCookie } from "hono/cookie";
import { csrf } from "hono/csrf";
import { jwt } from "hono/jwt";

const app = new Hono();

app
  .use("/api/auth/*", jwt({ secret: process.env.JWT_SECRET!, cookie: "authToken" }))
  .use("/api/*", csrf())
  .post("/api/signup", signupValidator, async (c) => {
    const { email, password } = c.req.valid("json");
    try {
      const userId = await insertUser(db, email, password);
      const token = await generateToken(userId);
      setCookie(c, "authToken", token, cookieOpts);
      return c.json({ message: "User registered successfully", user: { id: userId, email } });
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

      const token = await generateToken(user.id);
      setCookie(c, "authToken", token, cookieOpts);
      return c.json({ message: "Login successful", user: { id: user.id, email } });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ errors: ["Internal Server Error"] }, 500);
    }
  })
  .post("/api/logout", (c) => {
    deleteCookie(c, "authToken", {
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
