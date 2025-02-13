import { serve } from "bun";
import connectDB from "./db";
import app from "./app";
import { ruleCache } from "./Controller/cache";

const port = process.env.PORT || 4444;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1); // Exit and let process manager restart
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // Exit and let process manager restart
});

connectDB()
  .then(() => {
    ruleCache.initialize();
    serve({
      fetch: app.fetch,
      port: Number(port),
      // hostname: "0.0.0.0",
    });

    console.log(`Server is running on http://0.0.0.0:${port}`);
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    // Let DB handle reconnection
  });
