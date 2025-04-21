import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import ruleRouter from "./Routes/ruleRouter";
const app = new Hono()
  .use(poweredBy())
  .use(secureHeaders())
  .use(logger())
  .route("/v1/rule", ruleRouter)
  .route("/v1/rules", ruleRouter);

export default app;
