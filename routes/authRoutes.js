import express from "express";

import {
  loginUser,
  verifyUser,
  verifyEmail,
  sendVerificationCode,
} from "../controllers/userController.js";
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/verify", middleware, verifyUser);
router.post("/verify-email", verifyEmail);
router.post("/send-code", sendVerificationCode);

export default router;
