import express from "express";

import {
  registerUser,
  loginUser,
  verifyUser,
} from "../controllers/userController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify", middleware, verifyUser);

export default router;
