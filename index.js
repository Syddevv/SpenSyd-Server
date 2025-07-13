import express from "express";
import connectToDb from "./db/db.js";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  connectToDb();
  console.log("Server Up!");
});
