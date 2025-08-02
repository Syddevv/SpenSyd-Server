import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // Exit if DB connection fails
  }
};

export default connectToDb;
