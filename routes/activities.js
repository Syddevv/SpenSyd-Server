import express from "express";
import {
  addActivity,
  getRecentActivities,
} from "../controllers/activitiesController.js";
import { verifyToken } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/add", verifyToken, addActivity);
router.get("/recent", verifyToken, getRecentActivities);

export default router;
