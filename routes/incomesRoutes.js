import express from "express";
import { addBalance } from "../controllers/incomesController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/addBalance", middleware, addBalance);

export default router;
