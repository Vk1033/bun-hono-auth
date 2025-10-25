# Bun-Hono-JWT

Lightweight authentication example using Bun, Hono, Drizzle (SQLite) and Zod for validation.

This repository demonstrates a minimal email/password authentication flow with JWT access & refresh tokens, HTTP-only cookies for refresh tokens, CSRF protection for non-auth endpoints and a small Drizzle-based SQLite user table.

## Highlights

- Framework: Hono (handler + middleware)
- Runtime: Bun
- ORM: Drizzle (bun-sqlite)
- Validation: Zod (via @hono/zod-validator)
- Auth: JWT access token (short-lived) + refresh token (cookie)

## Quick start

Prerequisites: Bun installed (https://bun.sh)

1. Install dependencies

```sh
bun install
```

2. Add environment variables (see below). A minimal .env file could look like:

```env
DB_FILE_NAME=db.sqlite
ACCESS_TOKEN_SECRET=some-long-random-secret
REFRESH_TOKEN_SECRET=another-long-random-secret
NODE_ENV=development
```

3. Run the dev server

```sh
bun run dev
```

Open http://localhost:3000

## Environment variables

- `DB_FILE_NAME` — path to the SQLite file used by Drizzle (required). Default examples in the repo use `db.sqlite`.
- `ACCESS_TOKEN_SECRET` — secret used to sign short-lived access tokens (required).
- `REFRESH_TOKEN_SECRET` — secret used to sign refresh tokens (required).
- `NODE_ENV` — set to `production` to make cookies secure (optional).

Keep your secrets out of source control. Use a secrets manager or environment-specific configuration in production.

## Project layout

- `src/index.ts` — Hono app and routes (signup, login, refresh, logout, authenticated `me` route).
- `src/helpers.ts` — token generation and cookie options.
- `src/db/schema.ts` — Drizzle table definition for `users`.
- `src/db/queries.ts` — small helper functions (insertUser, getUserByEmail, getUserById).
- `src/schemas/signup-schema.ts` — request validation using Zod.
- `src/index.http` — quick HTTP examples you can import into API clients like Insomnia/Postman.

## Endpoints

Base URL: http://localhost:3000

1) POST /api/signup

Request JSON:

```json
{
	"email": "user@example.com",
	"password": "password123"
}
```

Response (201-ish on success):

```json
{
	"accessToken": "<jwt>",
	"message": "User registered successfully",
	"user": { "id": "<uuid>", "email": "user@example.com" }
}
```

Notes: A `refreshToken` cookie is set as an HTTP-only cookie by the server.

2) POST /api/login

Request JSON same as signup. Returns access token and sets refresh token cookie on success.

3) POST /api/refresh

Uses the refresh token cookie to validate and returns a new access token (and rotates refresh token cookie).

4) POST /api/logout

Clears the refresh token cookie.

5) GET /api/auth/me

Protected route (requires valid access token). Protected via `jwt` middleware that looks for a cookie named `accessToken` (see `src/index.ts`).

## Security notes

- Access tokens are short-lived (15 minutes). Refresh tokens live for 7 days and are stored in an HTTP-only cookie.
- CSRF protection is applied to `/api/*` routes (see `hono/csrf` middleware usage). The refresh and auth routes are wired to use `jwt` middleware where appropriate.
- For production: use strong, random secrets, serve over HTTPS, and consider additional hardening (rate-limit, email verification, password reset, account lockouts).

## Database & migrations

This project uses Drizzle ORM with Bun's SQLite client. The schema is defined in `src/db/schema.ts`.

There is a `drizzle` folder and a `drizzle.config.ts` file included; if you use `drizzle-kit` you can run migrations according to your setup. The project includes a sample SQL file in `drizzle/0000_wise_mandarin.sql`.

## Tests

There are a few test files in the repo (for example `src/index.test.ts` and `src/db/queries.test.ts`). Bun provides a built-in test runner — you can run:

```sh
bun test
```

If your environment requires TypeScript test runner tooling (ts-node/tsx), adapt accordingly. The project currently lists `tsx` in devDependencies.

## Scripts

Defined in `package.json`:

- `dev` — starts the app using Bun's hot-reload: `bun run --hot src/index.ts`.

Run with:

```sh
bun run dev
```

## Extending this project

- Add email verification, password reset flows and rate limiting.
- Swap SQLite for Postgres/MySQL by changing the Drizzle client and configuration.
- Add tests for edge cases (duplicate signup, token expiry, token tampering).

## Troubleshooting

- If you see errors about missing env vars, ensure `DB_FILE_NAME`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET` are present.
- If cookies aren't being set in the browser: check `NODE_ENV` and HTTPS. In production the cookie `secure` flag is set when `NODE_ENV=production`.