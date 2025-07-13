import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB ✅");
  } catch (error) {
    console.log("Error in Connectin to DB ❌", error.message);
  }
};

export default connectToDb;
