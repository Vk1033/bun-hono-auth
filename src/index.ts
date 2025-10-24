import { Hono } from "hono";
import { dbConn } from "./db/db";
import { signupValidator } from "./schemas/signup-schema";
import { insertUser } from "./db/queries";
import { cookieOpts, generateToken } from "./helpers";
import { setCookie } from "hono/cookie";

const app = new Hono();

app.post("/api/signup", signupValidator, async (c) => {
  const db = dbConn();
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
});

export default app;
