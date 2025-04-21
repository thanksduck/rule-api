import { Context, Next } from "hono";

const token = process.env.TOKEN as string;

export default async function protect(
  c: Context,
  next: Next,
): Promise<Response | void> {
  if (c.req.header("Authorization") !== `Bearer ${token}`) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  await next();
}
