import { Hono } from "hono";
import { createRule, deleteRule, disableRule, enableRule, getAllRules, getAllRulesDomain, getRule, upateRule } from "./Controller/ruleController";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { protect, validateBody } from "./Middleware/protect";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
const app = new Hono();

app.use(poweredBy());
app.use(secureHeaders());
app.use(logger());
app.use(cors());

app.get('/', (c) => c.text('Hello Bun!'))

// Get Rule from all of the domains
app.get("/rule", protect, getAllRules);
app.get("/rules", protect, getAllRules);
// Get Rule from a specific domain
app.get("/rule/:domain", protect, getAllRulesDomain);
app.get("/rules/:domain", protect, getAllRulesDomain);

// Create Rule Endpoints all of them do the same thing.
app.post("/rule", protect, validateBody ,createRule);
app.post("/rules", protect, validateBody ,createRule);
app.post("/rule/:domain", protect, validateBody ,createRule);
app.post("/rules/:domain", protect, validateBody ,createRule);


// Get Rule by ID
app.get("/rule/:domain/:rule", protect, getRule);
app.get("/rules/:domain/:rule", protect, getRule);

// Update Rule by ID
app.patch("/rule/:domain/:rule", protect, validateBody, upateRule);
app.patch("/rules/:domain/:rule", protect, validateBody, upateRule);
// Disable Rule by ID
app.delete("/rule/:domain/:rule/turn-off", protect, disableRule);
app.delete("/rules/:domain/:rule/turn-off", protect, disableRule);
// Enable Rule by ID
app.patch("/rule/:domain/:rule/turn-on", protect, enableRule);
app.patch("/rules/:domain/:rule/turn-on", protect, enableRule);
// Delete Rule by ID
app.delete("/rule/:domain/:rule", protect, deleteRule);
app.delete("/rules/:domain/:rule", protect, deleteRule);
export default app;