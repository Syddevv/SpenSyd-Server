import express from "express";
import { addExpense } from "../controllers/expensesController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addExpense", middleware, addExpense);

export default router;
