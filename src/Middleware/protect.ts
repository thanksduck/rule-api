import { Context, Next } from "hono";
import validator from "validator";

const token = process.env.TOKEN;

interface RuleBody {
  domain?: string;
  alias: string;
  destination: string;
  username: string;
  comment?: string;
  active?: boolean;
  count?: number;
}

export const protect = async (c: Context, next: Next) => {
  if (c.req.header("Authorization") !== `Bearer ${token}`) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  await next();
};

export const validateBody = async (c: Context, next: Next) => {
  try {
    const body: Partial<RuleBody> = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return c.json({ success: false, error: "Invalid request body" }, 400);
    }

    const lowercasedBody: Partial<RuleBody> = Object.entries(body).reduce(
      (acc, [key, value]) => {
        acc[key] =
          key !== "comment" && typeof value === "string"
            ? value.toLowerCase()
            : value;
        return acc;
      },
      {} as Record<string, any>,
    );

    const domain =
      lowercasedBody.domain || c.req.param("domain")?.toLowerCase();
    if (!body.alias || !body.destination || !body.username || !domain) {
      return c.json(
        {
          success: false,
          error: "Alias, destination, domain, and username are required",
        },
        400,
      );
    }
    lowercasedBody.domain = domain;

    if (!lowercasedBody.alias || !validator.isEmail(lowercasedBody.alias)) {
      return c.json(
        { error: "Alias must be a valid email", success: false },
        400,
      );
    }
    if (
      !lowercasedBody.destination ||
      !validator.isEmail(lowercasedBody.destination)
    ) {
      return c.json(
        { success: false, error: "Destination must be a valid email" },
        400,
      );
    }
    if (validator.isURL(domain, { require_protocol: true })) {
      return c.json({ success: false, error: "Domain must not be a URL" }, 400);
    }

    if (lowercasedBody.alias) {
      const [, aliasDomain] = lowercasedBody.alias.split("@");
      if (!aliasDomain || aliasDomain !== domain) {
        return c.json(
          {
            success: false,
            error: "Alias domain doesn't match the specified domain",
          },
          400,
        );
      }
    } else {
      return c.json({ success: false, error: "Alias is required" }, 400);
    }

    c.set("validatedBody", lowercasedBody);
    await next();
  } catch (error) {
    console.error("Error in validateBody middleware:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
};
