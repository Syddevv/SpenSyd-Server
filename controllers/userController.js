import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import ExpenseModel from "../models/Expenses.js";
import IncomeModel from "../models/Incomes.js";
import ActivityModel from "../models/Activities.js";

dotenv.config();

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  if (extValid) cb(null, true);
  else cb(new Error("Only image files allowed"));
};

export const upload = multer({ storage, fileFilter });

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email is already taken",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user directly
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: true, // Auto-verify since we skipped email check
      profilePicture: "", // Default empty or set a default URL
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong Credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false });
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profilePics",
        });
        user.profilePicture = result.secure_url;
      } catch (cloudErr) {
        console.error("Cloudinary upload failed:", cloudErr);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    if (req.body.username) {
      user.username = req.body.username;
    }

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Profile updated", user });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "username email profilePicture"
    );
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Cannot fetch user" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};

export const changeEmail = async (req, res) => {
  // 1. Extract 'newEmail' (matching the frontend), not 'email'
  const { newEmail } = req.body;
  const userId = req.user._id;

  try {
    // 2. Validate 'newEmail'
    if (!newEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an email address." });
    }

    // 3. Check if 'newEmail' is already taken
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists && emailExists._id.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This email is already associated with another account.",
      });
    }

    const user = await User.findById(userId);

    if (user) {
      // 4. Update the user's email
      user.email = newEmail;

      // OPTIONAL: If you want to force re-verification
      user.isVerified = false;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: "Email updated successfully",
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to update email",
    });
  }
};

export const resetUserData = async (req, res) => {
  try {
    const { type } = req.body; // 'expenses', 'incomes', 'all'
    const userId = req.user.id || req.user._id;

    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "Reset type is required" });
    }

    if (type === "expenses") {
      await ExpenseModel.deleteMany({ userId });
      await ActivityModel.deleteMany({ userId, type: "expense" });
    } else if (type === "incomes") {
      await IncomeModel.deleteMany({ userId });
      await ActivityModel.deleteMany({ userId, type: "income" });
    } else if (type === "all") {
      await ExpenseModel.deleteMany({ userId });
      await IncomeModel.deleteMany({ userId });
      await ActivityModel.deleteMany({ userId });
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Data reset successfully" });
  } catch (error) {
    console.error("Reset Data Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reset data" });
  }
};
