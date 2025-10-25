import { sign } from "hono/jwt";
import { CookieOptions } from "hono/utils/cookie";

export const generateAccessToken = async (userId: string) => {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: now,
    exp: now + 60 * 15, // 15 minutes
  };
  const token = await sign(payload, secret!);
  return token;
};

export const generateRefreshToken = async (userId: string) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  };
  const token = await sign(payload, secret!);
  return token;
};

export const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax", // or "Strict"
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
} as CookieOptions;
