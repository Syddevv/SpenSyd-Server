import express from "express";
import connectToDb from "./db/db.js";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";
import expenseRouter from "./routes/expensesRoutes.js";
import incomeRouter from "./routes/incomesRoutes.js";
import activityRouter from "./routes/activities.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/balance", incomeRouter);
app.use("/api/activity", activityRouter);

app.listen(MONGO_URL, () => {
  connectToDb();
  console.log(`Server Up! Running on port ${MONGO_URL}`);
});
