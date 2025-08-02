import express from "express";
import connectToDb from "./db/db.js";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";
import expenseRouter from "./routes/expensesRoutes.js";
import incomeRouter from "./routes/incomesRoutes.js";
import activityRouter from "./routes/activities.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/balance", incomeRouter);
app.use("/api/activity", activityRouter);

// ✅ Wait until DB is connected before starting the server
connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server connected to DB and running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err);
  });
