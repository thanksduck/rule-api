import app from "@/app";
import { ruleCache } from "@/controller/cache";
import { connectDB } from "@/db";
import { PORT } from "@/env";

connectDB()
  .then(() => {
    ruleCache.initialize();
    app.listen(PORT);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
    );
    console.log("✨ ==========================================  ✨");
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
  });
