import { zValidator } from "@hono/zod-validator";

import { z } from "zod";

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export const signupValidator = zValidator("json", signupSchema, (result, c) => {
  if (!result.success) {
    return c.json(
      {
        errors: result.error.issues.map((issue) => issue.message),
      },
      400
    );
  }
});
