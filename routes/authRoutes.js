import express from "express";
import {
  loginUser,
  verifyUser,
  registerUser,
  updateUserProfile,
  getUserProfile,
  changePassword,
  changeEmail,
} from "../controllers/userController.js";
import upload from "../middlewares/multer.js";
import { verifyToken, protect } from "../middlewares/middleware.js";

const router = express.Router();

// ==================== AUTHENTICATION ROUTES ====================
router.post("/login", loginUser);
router.get("/verify", verifyToken, verifyUser);

// ==================== REGISTRATION ROUTES ====================
// Direct registration (No email verification)
router.post("/register", registerUser);

// ==================== PROFILE ROUTES ====================
router.get("/me", verifyToken, getUserProfile);
router.put(
  "/updateProfile/:id",
  verifyToken,
  upload.single("profilePicture"),
  updateUserProfile
);

// ==================== PASSWORD ROUTES ====================
router.put("/change-password", protect, changePassword);

// ==================== EMAIL ROUTES ====================
router.put("/change-email/direct", protect, changeEmail);

export default router;
