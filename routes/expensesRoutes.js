import express from "express";
import { addExpense, fetchExpense } from "../controllers/expensesController.js";
import { verifyToken } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addExpense", verifyToken, addExpense);
router.get("/getExpenses", verifyToken, fetchExpense);

export default router;
