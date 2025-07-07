import Elysia, { t } from "elysia";
import { Rule } from "@/db/schema";
import { updateRuleCount } from "@/utils";
import { toggleActionField } from "@/validation/_common";
import { PAGINATION } from "@/validation/_list";
import {
  allowedDomains,
  CreateRuleSchema,
  GetRuleSchema,
  RuleListSchema,
  RuleSchema,
} from "@/validation/_rule";
import { ruleCache } from "./cache";

export const ruleHandler = new Elysia({
  name: "rule_handler",
})
  .get(
    "/",
    async ({ status, query }) => {
      const {
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_PAGE_SIZE,
        sortBy = "updatedAt",
        sortOrder = "desc",
        domain = "1as.in",
        active = true,
      } = query;

      try {
        // Count total documents for pagination info
        const total = await Rule.countDocuments({ domain, active });
        const rules = await Rule.find({ domain, active })
          .sort({ [sortBy]: sortOrder })
          .skip((page - 1) * limit)
          .limit(limit);
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
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
        };
      } catch (error) {
        return status(500, {
          success: false,
          message: error instanceof Error ? error.message : "Listing failed",
        });
      }
    },
    { query: RuleListSchema },
  )
  .get(
    "/:domain/:alias",
    async ({ params, status }) => {
      const domain = params.domain.toLowerCase();
      const alias = params.domain.toLowerCase().split("@")[0] || "";
      try {
        const cachedRule = ruleCache.getRule(domain, alias);
        if (cachedRule) {
          // If found in cache, update count in background
          if (!cachedRule.active) return status(404, "Not Found");
          updateRuleCount(domain, alias).catch(console.error);
          return {
            success: true,
            message: "Rule found",
            data: cachedRule.destination,
          };
        }
        // If not in cache, fetch from database
        const foundRule = await Rule.findOneAndUpdate(
          { domain, alias, active: true },
          { $inc: { count: 1 } },
          { new: true },
        );
        if (!foundRule || !foundRule.active) return status(404, "Not Found");
        ruleCache.addRule(foundRule);
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      params: GetRuleSchema,
    },
  )
  .post(
    "/",
    async ({ body, status }) => {
      body.alias = body.alias.toLowerCase();
      body.destination = body.destination.toLowerCase();
      body.username = body.username.toLowerCase();
      body.domain = body.domain.toLowerCase();
      const { domain, alias } = body;
      if (!allowedDomains.has(domain)) return status(400, "Bad Request");
      try {
        const existingRule = await Rule.findOne({
          domain,
          alias,
        });
        if (existingRule) {
          return status(403, "Forbidden");
        }
        const rule = new Rule(body);
        await rule.save();
        ruleCache.addRule(rule);
        return status(201, {
          success: true,
          message: "Rule created successfully",
          data: rule,
        });
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      body: CreateRuleSchema,
    },
  )

  .post(
    "/:domain",
    async ({ params, body, status }) => {
      body.alias = body.alias.toLowerCase();
      body.destination = body.destination.toLowerCase();
      body.username = body.username.toLowerCase();
      params.domain = params.domain.toLowerCase();
      const { alias } = body;
      const { domain } = params;
      if (!allowedDomains.has(domain)) return status(400, "Bad Request");
      try {
        const existingRule = await Rule.findOne({
          domain,
          alias,
        });
        if (existingRule) {
          return status(403, "Forbidden");
        }
        const rule = new Rule({ ...body, domain });
        await rule.save();
        ruleCache.addRule(rule);
        return status(201, {
          success: true,
          message: "Rule created successfully",
          data: rule,
        });
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      params: t.Pick(RuleSchema, ["domain"]),
      body: t.Omit(CreateRuleSchema, ["domain"]),
    },
  )

  .patch(
    "/:domain/:alias",
    async ({ body, status, params }) => {
      // the lookup will be based on the params
      params.domain = params.domain.toLowerCase();
      params.alias = params.alias.toLowerCase().split("@")[0]!;

      // the update will be based on the body
      if (body.destination) body.destination = body.destination.toLowerCase();
      if (body.alias) body.alias = body.alias.toLowerCase().split("@")[0]!;
      if (body.username) body.username = body.username.toLowerCase();
      if (body.domain) body.domain = body.domain.toLowerCase();

      const { domain, alias } = params;
      try {
        const updatedRule = await Rule.findOneAndUpdate(params, body);
        if (!updatedRule) {
          return status(404, "Not Found");
        }
        ruleCache.updateRule(
          domain,
          alias,
          updatedRule.destination,
          updatedRule.active,
        );
        return {
          success: true,
          message: "Rule updated successfully",
          data: updatedRule,
        };
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      params: t.Pick(RuleSchema, ["domain", "alias"]),
      body: t.Partial(CreateRuleSchema),
    },
  )
  .patch(
    "/:domain/:alias/:action",
    async ({ params, status }) => {
      params.domain = params.domain.toLowerCase();
      params.alias = params.alias.toLowerCase().split("@")[0] || "";
      const { domain, alias, action } = params;
      try {
        const foundRule = await Rule.findOne({ domain, alias });
        if (!foundRule) return status(404, "Not Found");
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
          return status(500, {
            success: false,
            error: "Failed to update rule",
          });
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
        return {
          success: true,
          message: `Rule has been ${actionPast}`,
          data: updatedRule,
        };
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      params: t.Composite([
        t.Pick(RuleSchema, ["domain", "alias"]),
        t.Object({
          action: toggleActionField,
        }),
      ]),
    },
  )

  .delete(
    "/:domain/:alias",
    async ({ status, params }) => {
      params.domain = params.domain.toLowerCase();
      params.alias = params.alias.toLowerCase().split("@")[0] || "";
      const { domain, alias } = params;
      try {
        const foundRule = await Rule.findOneAndDelete({ domain, alias });
        ruleCache.removeRule(domain, alias);
        if (!foundRule) {
          return status(404, "Not Found");
        }
        return status(204, null);
      } catch (error) {
        console.error(error, "Error getting address");
        return status(500, {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to get address",
        });
      }
    },
    {
      params: t.Pick(RuleSchema, ["domain", "alias"]),
    },
  );
