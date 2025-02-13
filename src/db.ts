import mongoose from "mongoose";

const connectDB = async () => {
  const maxRetries = 5;
  const retryDelay = 5000;
  let currentTry = 1;

  while (currentTry <= maxRetries) {
    try {
      await mongoose.connect(`${process.env.MONGO_STRING}`);
      console.log("MongoDB connected successfully");
      return;
    } catch (error) {
      console.error(
        `MongoDB connection error (attempt ${currentTry}/${maxRetries}):`,
        error,
      );

      if (currentTry === maxRetries) {
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }

      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      currentTry++;
    }
  }
};

export default connectDB;
