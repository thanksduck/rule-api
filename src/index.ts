import { serve } from "bun";
import connectDB from "./db";
import app from "./app";
import { ruleCache } from "./Controller/cache";

const port = process.env.PORT || 4444;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Keep process running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Keep process running
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
    // Don't exit, keep trying to connect
    setTimeout(() => {
      connectDB();
    }, 5000);
  });
