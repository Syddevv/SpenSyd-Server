import express from "express";
import { addExpense, fetchExpense } from "../controllers/expensesController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addExpense", middleware, addExpense);
router.get("/getExpenses", middleware, fetchExpense);

export default router;
