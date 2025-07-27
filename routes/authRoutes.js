import express from "express";
import {
  loginUser,
  verifyUser,
  verifyEmail,
  sendVerificationCode,
  updateUserProfile,
  getUserProfile,
} from "../controllers/userController.js";
import middleware from "../middlewares/middleware.js";
import upload from "../middlewares/multer.js"; // ✅ Use your custom multer config

const router = express.Router();

router.post("/login", loginUser);
router.get("/verify", middleware, verifyUser);
router.post("/verify-email", verifyEmail);
router.post("/send-code", sendVerificationCode);

router.put(
  "/updateProfile/:id",
  middleware,
  upload.single("profilePicture"), // ✅ Proper file upload middleware
  updateUserProfile
);

router.get("/me", middleware, getUserProfile);

export default router;
