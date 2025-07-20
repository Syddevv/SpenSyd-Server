import express from "express";
import { addBalance, fetchBalance } from "../controllers/incomesController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addBalance", middleware, addBalance);
router.get("/getBalances", middleware, fetchBalance);

export default router;
