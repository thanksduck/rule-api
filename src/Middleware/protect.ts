import { Context, Next } from "hono";
import validator from "validator";

const token = process.env.TOKEN;
const allowedDomains = new Set(
  `${process.env.ALLOWED_DOMAINS}`
    .split(" ")
    .map((domain) => domain.toLowerCase()),
);

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

interface RuleBody {
  alias: string;
  destination: string;
  username: string;
  domain?: string;
  comment?: string;
}

export const validateBody = async (c: Context, next: Next) => {
  try {
    const body: Partial<RuleBody> = await c.req.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return c.json({ success: false, error: "Invalid request body" }, 400);
    }

    const lowercasedBody: Partial<RuleBody> = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        key !== "comment" && typeof value === "string"
          ? value.toLowerCase()
          : value,
      ]),
    );

    // Extract domain from params or body, ensure it's lowercase
    const domain = (
      lowercasedBody.domain || c.req.param("domain")
    )?.toLowerCase();

    if (
      !lowercasedBody.alias ||
      !lowercasedBody.destination ||
      !lowercasedBody.username ||
      !domain
    ) {
      return c.json(
        {
          success: false,
          error: "Alias, destination, domain, and username are required",
        },
        400,
      );
    }
    if (!allowedDomains.has(domain)) {
      return c.json({ success: false, error: "Domain not allowed" }, 400);
    }
    lowercasedBody.domain = domain;

    // Validate alias
    if (!validator.isEmail(lowercasedBody.alias)) {
      return c.json(
        { success: false, error: "Alias must be a valid email" },
        400,
      );
    }

    // Validate destination
    if (!validator.isEmail(lowercasedBody.destination)) {
      return c.json(
        { success: false, error: "Destination must be a valid email" },
        400,
      );
    }

    // Validate domain
    if (validator.isURL(domain, { require_protocol: true })) {
      return c.json({ success: false, error: "Domain must not be a URL" }, 400);
    }

    // Check if alias domain matches the specified domain
    const [, aliasDomain] = lowercasedBody.alias.split("@");
    if (aliasDomain !== domain) {
      return c.json(
        {
          success: false,
          error: "Alias domain doesn't match the specified domain",
        },
        400,
      );
    }

    c.set("validatedBody", lowercasedBody);
    await next();
  } catch (error) {
    console.error("Error in validateBody middleware:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
};
