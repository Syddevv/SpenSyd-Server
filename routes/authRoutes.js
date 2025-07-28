import express from "express";
import {
  loginUser,
  verifyUser,
  verifyEmail,
  sendVerificationCode, // ✅ Registration only
  updateUserProfile,
  getUserProfile,
  changePassword,
  sendResetCode, // ✅ Forgot password (not logged in)
  sendResetCodeLoggedIn, // ✅ Forgot password (logged in)
  verifyResetCode,
  resetPassword,
  sendCurrentEmailCode,
  verifyCurrentEmailCode,
  sendNewEmailCode,
  verifyNewEmailCodeAndUpdate,
} from "../controllers/userController.js";

import upload from "../middlewares/multer.js";
import { verifyToken, protect } from "../middlewares/middleware.js";

const router = express.Router();

// ==================== AUTHENTICATION ROUTES ====================
router.post("/login", loginUser);
router.get("/verify", verifyToken, verifyUser);

// ==================== REGISTRATION ROUTES ====================
router.post("/verify-email", verifyEmail);
router.post("/send-code", sendVerificationCode); // Only for new user signup

// ==================== PROFILE ROUTES ====================
router.get("/me", verifyToken, getUserProfile);
router.put(
  "/updateProfile/:id",
  verifyToken,
  upload.single("profilePicture"),
  updateUserProfile
);

// ==================== PASSWORD ROUTES ====================
// Change password (knows current password)
router.put("/change-password", protect, changePassword);

// Forgot password flows
router.post("/send-reset-code", sendResetCode); // Not logged in
router.post("/send-reset-code/logged-in", verifyToken, sendResetCodeLoggedIn); // Logged in
router.post("/verify-reset-code", verifyResetCode); // Common verification
router.post("/reset-password", resetPassword); // Common reset

// ==================== EMAIL CHANGE ROUTES ====================
router.post(
  "/change-email/send-current-code",
  verifyToken,
  sendCurrentEmailCode
);
router.post(
  "/change-email/verify-current-code",
  verifyToken,
  verifyCurrentEmailCode
);
router.post("/change-email/send-new-code", verifyToken, sendNewEmailCode);
router.post(
  "/change-email/verify-new-code",
  verifyToken,
  verifyNewEmailCodeAndUpdate
);

export default router;
