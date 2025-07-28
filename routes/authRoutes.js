import express from "express";
import {
  loginUser,
  verifyUser,
  verifyEmail,
  sendVerificationCode, // ✅ Registration only
  updateUserProfile,
  getUserProfile,
  changePassword,
  sendResetCode, // ✅ Forgot password only
  verifyResetCode,
  resetPassword,
} from "../controllers/userController.js";

import upload from "../middlewares/multer.js";
import { verifyToken, protect } from "../middlewares/middleware.js";

const router = express.Router();

// ✅ AUTHENTICATION ROUTES
router.post("/login", loginUser);
router.get("/verify", verifyToken, verifyUser);

// ✅ REGISTRATION: Verify Email Code (for new accounts)
router.post("/verify-email", verifyEmail);
router.post("/send-code", sendVerificationCode); // 🚨 ONLY for new user signup

// ✅ PROFILE
router.get("/me", verifyToken, getUserProfile);
router.put(
  "/updateProfile/:id",
  verifyToken,
  upload.single("profilePicture"),
  updateUserProfile
);

// ✅ PASSWORD
router.put("/change-password", protect, changePassword);

// ✅ FORGOT PASSWORD FLOW
router.post("/send-reset-code", sendResetCode); // Sends code to existing email
router.post("/verify-reset-code", verifyResetCode); // Verifies reset code
router.post("/reset-password", resetPassword); // Resets password

export default router;
