import cors from "@elysiajs/cors";
import serverTiming from "@elysiajs/server-timing";
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";
import { isDev } from "./env";
import { ruleRouter } from "./router/rule-router";

export default new Elysia({
  name: "rule_api_app",
})
  .use(
    swagger({
      documentation: {
        tags: [
          {
            name: "Rules",
            description: "1as Rule related Endpoints",
          },
          {
            name: "Rule",
            description: "Just an alias to rules",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }),
  )
  .use(
    serverTiming({
      enabled: isDev,
    }),
  )
  .use(cors())
  .decorate("poweredBy", "elysia-by-sivam")
  .onRequest(({ set }) => {
    set.headers["X-Powered-By"] = "elysia-by-sivam";
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
  })
  .use(ruleRouter)
  .get("/health", () => {
    return "Hey I'm alive\n";
  });
