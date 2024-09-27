import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import ruleRouter from "./Routes/ruleRouter";
const app = new Hono();

// Built-in Middleware
app.use(poweredBy());
app.use(secureHeaders());
app.use(logger());

app.route("/v1/rule", ruleRouter);
app.route("/v1/rules", ruleRouter);

export default app;
