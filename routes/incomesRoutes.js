import express from "express";
import { addBalance, fetchBalance } from "../controllers/incomesController.js";
import { verifyToken } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addBalance", verifyToken, addBalance);
router.get("/getBalances", verifyToken, fetchBalance);

export default router;
