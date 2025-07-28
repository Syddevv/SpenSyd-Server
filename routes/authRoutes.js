import express from "express";
import {
  loginUser,
  verifyUser,
  verifyEmail,
  sendVerificationCode,
  updateUserProfile,
  getUserProfile,
  changePassword,
} from "../controllers/userController.js";
import upload from "../middlewares/multer.js"; // ✅ Use your custom multer config
import { verifyToken, protect } from "../middlewares/middleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/verify", verifyToken, verifyUser);
router.post("/verify-email", verifyEmail);
router.post("/send-code", sendVerificationCode);

router.put(
  "/updateProfile/:id",
  verifyToken,
  upload.single("profilePicture"), // ✅ Proper file upload middleware
  updateUserProfile
);

router.get("/me", verifyToken, getUserProfile);
router.put("/change-password", protect, changePassword);

export default router;
