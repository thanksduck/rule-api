import { serve } from "bun";
import connectDB from "./db";
import app from "./app";

const port = process.env.PORT || 4444;

connectDB()
  .then(() => {
    console.log("Connected to database");

    serve({
      fetch: app.fetch,
      port: Number(port),
      // hostname: "0.0.0.0",
    });

    console.log(`Server is running on http://0.0.0.0:${port}`);
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
