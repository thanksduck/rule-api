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
      return c.json({ error: "Rule already exists" }, 409);
    }
    const rule = new Rule(validatedBody);
    await rule.save();
    return c.json(rule, 201);
  } catch (error) {
    console.error("Error creating rule:", error);
    return c.json({ error: "Internal Server Error" }, 500);
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
      { new: true }
    );
    if (!updatedRule) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json(updatedRule);
  } catch (error) {
    console.error("Error updating rule:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

export const getRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json({ error: "Domain and rule are required" }, 400);
  }
  // check if rule variable has @ symbol if it has then const alias = rule : else const alias = `${rule}@${domain}`;
  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  // const alias = `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: true },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (!foundRule) {
    return c.json({ error: "Rule not found" }, 404);
  }

  return c.json(foundRule);
};

export const getAllRules = async (c: Context) => {
  const rules = await Rule.find({});
  return c.json(rules);
};

export const getAllRulesDomain = async (c: Context) => {
  const domain = c.req.param("domain");
  const rules = await Rule.find({ domain });
  return c.json(rules);
};

export const disableRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json({ error: "Domain and rule are required" }, 400);
  }

  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: true },
    { active: false },
    { new: true }
  );

  if (!foundRule) {
    return c.json({ error: "Rule not found" }, 404);
  }

  return c.json({ foundRule, message: "Rule has been disabled" });
};

export const enableRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json({ error: "Domain and rule are required" }, 400);
  }

  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndUpdate(
    { domain, alias, active: false },
    { active: true },
    { new: true }
  );

  if (!foundRule) {
    return c.json({ error: "Rule not found" }, 404);
  }

  return c.json({ foundRule, message: "Rule has been enabled" });
};

export const deleteRule = async (c: Context) => {
  const domain = c.req.param("domain");
  const rule = c.req.param("rule");

  if (!domain || !rule) {
    return c.json({ error: "Domain and rule are required" }, 400);
  }

  const alias = rule.includes("@") ? rule : `${rule}@${domain}`;
  const foundRule = await Rule.findOneAndDelete({ domain, alias });

  if (!foundRule) {
    return c.json({ error: "Rule not found" }, 404);
  }

  return c.json({ message: "Rule has been deleted" }, 204);
};
