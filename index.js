import express from "express";
import connectToDb from "./db/db.js";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes.js";
import expenseRouter from "./routes/expensesRoutes.js";
import incomeRouter from "./routes/incomesRoutes.js";
import activityRouter from "./routes/activities.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/balance", incomeRouter);
app.use("/api/activity", activityRouter);

// Root route (optional for Render health check)
app.get("/", (req, res) => {
  res.send("SpenSyd API is running ✅");
});

// Correct port binding for Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectToDb();
  console.log(`🚀 Server running on port ${PORT}`);
});
