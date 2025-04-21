import { Rule } from "../Model/Rule";
import { Context } from "hono";
import { ruleCache } from "./cache";

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
    ruleCache.addRule(rule);
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
    const alias = rule.includes("@") ? rule.split("@")[0] : rule;
    const updatedRule = await Rule.findOneAndUpdate(
      { domain, alias },
      { $set: c.get("validatedBody") },
      { new: true },
    );
    if (!updatedRule) return c.notFound();
    ruleCache.updateRule(
      domain,
      alias,
      updatedRule.destination,
      updatedRule.active,
    );
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

const updateRuleCount = async (domain: string, alias: string) => {
  try {
    await Rule.findOneAndUpdate(
      { domain, alias, active: true },
      { $inc: { count: 1 } },
      { new: true },
    );
  } catch (error) {
    // Log error but don't throw to prevent affecting the main request
    console.error("Failed to update rule count:", error);
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

  const alias = rule.includes("@") ? rule.split("@")[0] : rule;

  // First check cache
  const cachedRule = ruleCache.getRule(domain, alias);
  if (cachedRule) {
    // If found in cache, update count in background
    if (!cachedRule.active) return c.notFound();
    updateRuleCount(domain, alias).catch(console.error);
    return c.json({
      success: true,
      message: "Rule found",
      data: cachedRule.destination,
    });
  }

  // If not in cache, fetch from database
  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: true },
    { $inc: { count: 1 } },
    { new: true },
  );

  if (!foundRule || !foundRule.active) return c.notFound();

  // Update cache with the fresh data
  ruleCache.addRule(foundRule);

  return c.json({
    success: true,
    message: "Rule found",
    data: foundRule.destination,
  });
};

// export const getRule = async (c: Context) => {
//   const domain = c.req.param("domain");
//   const rule = c.req.param("rule");

//   if (!domain || !rule) {
//     return c.json(
//       { success: false, error: "Domain and rule are required" },
//       400,
//     );
//   }
//   const alias = rule.includes("@") ? rule.split("@")[0] : rule;
//   const foundRule =
//     ruleCache.getRule(domain, alias) ||
//     (await Rule.findOneAndUpdate(
//       { domain, alias, active: true },
//       { $inc: { count: 1 } },
//       { new: true },
//     ));

//   if (!foundRule || !foundRule.active) {
//     return c.json({ success: false, error: "Rule not found" }, 404);
//   }
//   const destination = foundRule.destination;
//   return c.json({
//     success: true,
//     message: "Rule found",
//     data: destination,
//   });
// };

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

    if (rules.length === 0) return c.notFound();

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

type ToggleAction = "enable" | "disable" | "switch" | "toggle" | "flip";

export const toggleRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");
  const action = c.req.param("action") as ToggleAction;

  if (!domain || !rule) {
    return c.json(
      { success: false, error: "Domain and rule are required" },
      400,
    );
  }

  if (!["enable", "disable", "switch", "toggle", "flip"].includes(action)) {
    return c.json(
      {
        success: false,
        error:
          "Invalid action. Use 'enable', 'disable', 'switch', 'toggle', or 'flip'",
      },
      400,
    );
  }

  const alias = rule.includes("@") ? rule.split("@")[0] : rule;

  try {
    const foundRule = await Rule.findOne({ domain, alias });

    if (!foundRule) return c.notFound();

    let newActiveState: boolean;
    switch (action) {
      case "enable":
        newActiveState = true;
        break;
      case "disable":
        newActiveState = false;
        break;
      case "switch":
      case "toggle":
      case "flip":
        newActiveState = !foundRule.active;
        break;
    }

    const updatedRule = await Rule.findOneAndUpdate(
      { domain, alias },
      { active: newActiveState },
      { new: true },
    );

    if (!updatedRule) {
      return c.json({ success: false, error: "Failed to update rule" }, 500);
    }

    ruleCache.updateRule(
      domain,
      alias,
      updatedRule.destination,
      newActiveState,
    );

    const actionPast =
      action === "enable"
        ? "enabled"
        : action === "disable"
          ? "disabled"
          : "toggled";

    return c.json({
      success: true,
      message: `Rule has been ${actionPast}`,
      data: updatedRule,
    });
  } catch (error) {
    console.error("Error toggling rule:", error);
    return c.json(
      { success: false, error: "An error occurred while modifying the rule" },
      500,
    );
  }
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

  const alias = rule.includes("@") ? rule.split("@")[0] : rule;
  const foundRule = await Rule.findOneAndDelete({ domain, alias });
  ruleCache.removeRule(domain, alias);
  if (!foundRule) {
    return c.json({ success: false, error: "Rule not found" }, 404);
  }

  return c.body(null, 204);
};
