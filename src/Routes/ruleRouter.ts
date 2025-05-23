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
import protect from "../Middleware/protect";
import validateBody from "../Middleware/validate";

const ruleRouter = new Hono();

// common Middleware
ruleRouter.use("*", protect);

// Get Rule from all of the domains

ruleRouter.get("/", getAllRules);
ruleRouter.get("/:domain", getAllRulesDomain);
ruleRouter.get("/:domain/:rule", getRule);

// Create Rule based on domain
ruleRouter.post("/:domain?", validateBody, createRule);

// Update Rule based on domain and rule
ruleRouter.patch("/:domain/:rule", validateBody, upateRule);
ruleRouter.patch("/:domain/:rule/:action", toggleRule);

// Delete Rule based on domain and rule
ruleRouter.delete("/:domain/:rule", deleteRule);

export default ruleRouter;
