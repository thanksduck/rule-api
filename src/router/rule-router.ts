import bearer from "@elysiajs/bearer";
import Elysia from "elysia";
import { rulesController } from "@/controller";
import { TOKEN } from "@/env";

export const ruleRouter = new Elysia({
  name: "rule_router",
  prefix: "/v1",
  detail: {
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
})
  .use(bearer())
  .onBeforeHandle(({ bearer, status }) => {
    if (typeof bearer !== "string") return status(401, "Unauthorized");
    if (bearer !== TOKEN) return status(401, "Unauthorized");
  })
  // .use(ruleController)
  .use(rulesController);
