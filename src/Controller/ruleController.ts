import { Rule } from "../Model/Rules";
import { Context } from "hono";

export const createRule = async (c: Context) => {
  try {
    const validatedBody = c.get("validatedBody");

    const existingRule = await Rule.findOne({
      domain: validatedBody.domain,
      alias: validatedBody.alias,
    });
    if (existingRule) {
      return c.json({ success: false, error: "Rule already exists" }, 409);
    }
    const rule = new Rule(validatedBody);
    await rule.save();
    return c.json(
      {
        success: true,
        message: "Rule created successfully",
        data: rule,
      },
      201,
    );
  } catch (error) {
    console.error("Error creating rule:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
};

export const upateRule = async (c: Context) => {
  try {
    const domain = c.req.param("domain");
    const rule = c.req.param("rule");
    const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
    const updatedRule = await Rule.findOneAndUpdate(
      { domain, alias },
      { $set: c.get("validatedBody") },
      { new: true },
    );
    if (!updatedRule) {
      return c.json({ success: false, error: "Rule not found" }, 404);
    }
    return c.json({
      success: true,
      message: "Rule updated successfully",
      data: updatedRule,
    });
  } catch (error) {
    console.error("Error updating rule:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
};

export const getRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json(
      { success: false, error: "Domain and rule are required" },
      400,
    );
  }
  // check if rule variable has @ symbol if it has then const alias = rule : else const alias = `${rule}@${domain}`;
  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  // const alias = `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: true },
    { $inc: { count: 1 } },
    { new: true },
  );

  if (!foundRule) {
    return c.json({ success: true, error: "Rule not found" }, 404);
  }
  const destination = foundRule.destination;
  return c.json({
    success: true,
    message: "Rule found",
    data: destination,
  });
};

// export const getAllRules = async (c: Context) => {
//   const rules = await Rule.find({});
//   if (rules.length === 0) {
//     return c.json({ success: false, error: "No rules found" }, 404);
//   }
//   return c.json({ success: true, message: "All rules", data: rules });
// };

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

export const getAllRules = async (c: Context) => {
  // Parse query parameters
  const page = Math.max(
    1,
    parseInt(c.req.query("page") || DEFAULT_PAGE.toString()),
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(c.req.query("limit") || DEFAULT_LIMIT.toString())),
  );
  const sortField = c.req.query("sortBy") || "createdAt";
  const sortOrder = c.req.query("sortOrder") === "asc" ? 1 : -1;
  const domain = c.req.query("domain");
  const active = c.req.query("active");

  // Build filter object
  const filter: any = {};
  if (domain) filter.domain = domain;
  if (active !== undefined) filter.active = active === "true";

  try {
    // Count total documents for pagination info
    const total = await Rule.countDocuments(filter);

    // Fetch rules with pagination, sorting, and filtering
    const rules = await Rule.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    if (rules.length === 0) {
      return c.json({ success: false, error: "No rules found" }, 404);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return c.json({
      success: true,
      message: "Rules retrieved successfully",
      data: rules,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
};

export const getAllRulesDomain = async (c: Context) => {
  const domain = c.req.param("domain");
  const rules = await Rule.find({ domain, active: true });
  if (rules.length === 0) {
    return c.json({ success: false, error: `No rules for ${domain}` }, 404);
  }
  return c.json({
    success: true,
    message: `All rules for ${domain}`,
    data: rules,
  });
};

export const toggleRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");
  const action = c.req.param("action"); // This should be either 'enable' or 'disable'

  if (!domain || !rule) {
    return c.json(
      { success: false, error: "Domain and rule are required" },
      400,
    );
  }

  if (action !== "enable" && action !== "disable") {
    return c.json(
      { success: false, error: "Invalid action. Use 'enable' or 'disable'" },
      400,
    );
  }

  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  const newActiveState = action === "enable";

  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: !newActiveState },
    { active: newActiveState },
    { new: true },
  );

  if (!foundRule) {
    return c.json({ success: false, error: "Rule not found" }, 404);
  }

  return c.json({
    success: true,
    message: `Rule has been ${action}d`,
    data: foundRule,
  });
};

export const deleteRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json(
      { success: false, error: "Domain and rule are required" },
      400,
    );
  }

  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndDelete({ domain, alias });

  if (!foundRule) {
    return c.json({ success: false, error: "Rule not found" }, 404);
  }

  return c.json(
    { success: true, message: "Rule has been deleted", data: null },
    204,
  );
};
