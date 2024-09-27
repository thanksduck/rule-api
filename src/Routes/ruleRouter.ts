import { Hono } from "hono";
import {
  createRule,
  deleteRule,
  toggleRule,
  getAllRules,
  getAllRulesDomain,
  getRule,
  upateRule,
} from "../Controller/ruleController";
import { protect, validateBody } from "../Middleware/protect";

const ruleRouter = new Hono();

// common Middleware
ruleRouter.use("*", protect);
ruleRouter.use("POST", validateBody);
ruleRouter.use("PATCH", validateBody);

// Get Rule from all of the domains

ruleRouter.get("/", getAllRules);
ruleRouter.get("/:domain", getAllRulesDomain);
ruleRouter.get("/:domain/:rule", getRule);

// Create Rule based on domain
ruleRouter.post("/:domain?", createRule);

// Update Rule based on domain and rule
ruleRouter.patch("/:domain/:rule", upateRule);
ruleRouter.patch("/:domain/:rule/:action", toggleRule);

// Delete Rule based on domain and rule
ruleRouter.delete("/:domain/:rule", deleteRule);

export default ruleRouter;
