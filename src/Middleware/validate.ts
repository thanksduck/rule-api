import { Context, Next } from "hono";
import { z } from "zod";

const allowedDomains = new Set<string>(
  (process.env.ALLOWED_DOMAINS as string)
    .split(" ")
    .map((domain) => domain.toLowerCase()),
);

// Create a Zod schema and infer the types from it
const ruleSchema = z
  .object({
    alias: z.string().email("Alias must be a valid email"),
    destination: z.string().email("Destination must be a valid email"),
    username: z.string(),
    domain: z.string().optional(),
    comment: z.string().optional(),
    active: z.boolean().optional(),
    count: z.number().int().optional(),
  })
  .refine(
    (data) => {
      const domain = data.domain?.toLowerCase() || "";
      return allowedDomains.has(domain);
    },
    {
      message: "Domain not allowed",
      path: ["domain"],
    },
  )
  .refine(
    (data) => {
      const [, aliasDomain] = data.alias.split("@");
      const domain = data.domain?.toLowerCase() || "";
      return aliasDomain.toLowerCase() === domain;
    },
    {
      message: "Alias domain doesn't match the specified domain",
      path: ["alias"],
    },
  )
  .refine(
    (data) => {
      const domain = data.domain?.toLowerCase() || "";
      return !domain.includes("://");
    },
    {
      message: "Domain must not be a URL",
      path: ["domain"],
    },
  );

// Infer types from the Zod schema
type RuleSchema = z.infer<typeof ruleSchema>;
type ValidatedBody = Omit<RuleSchema, "alias"> & { alias: string };

// Validation error handler
const validationErrorHandler = (
  result: z.SafeParseError<any>,
  c: Context,
): Response => {
  const firstError = result.error.issues[0];
  return c.json(
    {
      success: false,
      error: firstError.message,
    },
    400,
  );
};

// Updated validation middleware using Zod with the newer pattern
export default async function validateBody(
  c: Context,
  next: Next,
): Promise<Response | void> {
  try {
    const jsonData = await c.req.json();
    const result = ruleSchema.safeParse(jsonData);

    if (!result.success) {
      return validationErrorHandler(result, c);
    }

    const validatedData = result.data;

    // Extract domain from params if not in body
    let domain: string | undefined = validatedData.domain;

    if (!domain) {
      domain = c.req.param("domain")?.toLowerCase();

      if (!domain) {
        return c.json(
          {
            success: false,
            error: "Domain is required",
          },
          400,
        );
      }

      if (!allowedDomains.has(domain)) {
        return c.json(
          {
            success: false,
            error: "Domain not allowed",
          },
          400,
        );
      }
    }

    // Create normalized validated body
    const lowercasedBody: ValidatedBody = {
      ...validatedData,
      domain,
      alias: validatedData.alias.split("@")[0].toLowerCase(),
      destination: validatedData.destination.toLowerCase(),
      username: validatedData.username.toLowerCase(),
    };

    // Store the processed data in the context
    c.set("validatedBody", lowercasedBody);
    await next();
  } catch (error) {
    console.error("Error in validateBody middleware:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      500,
    );
  }
}
