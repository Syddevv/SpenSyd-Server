const tempUsers = {};

import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

export const sendVerificationCode = async (req, res) => {
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

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Temporarily store user data
    tempUsers[email] = {
      username,
      email,
      password,
      verificationCode,
      codeExpires,
    };

    // Send verification code email
    await transporter.sendMail({
      from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your SpenSyd Verification Code",
      text: `Welcome to SpenSyd, ${username}!

We're excited to have you join our growing community of smart spenders.
Track your expenses effortlessly, gain insights into your spending habits, and take
control of your finances — all in one place.

To get started, verify your email with this code:

🔐 Code: ${verificationCode}

It expires in 15 minutes.

If you didn’t sign up for SpenSyd, please ignore this email.

Thank you,  
SpenSyd`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent to email.",
    });
  } catch (error) {
    console.error("Verification code error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const tempUser = tempUsers[email];

  try {
    if (!tempUser || tempUser.verificationCode !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    if (tempUser.codeExpires < Date.now()) {
      delete tempUsers[email];
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempUser.password, salt);

    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      password: hashedPassword,
      isVerified: true,
    });

    await newUser.save();
    delete tempUsers[email];

    return res
      .status(200)
      .json({ success: true, message: "Email verified and account created" });
  } catch (error) {
    console.error("Verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during verification" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong Credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id, // <-- change 'id' to '_id'
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

export const verifyUser = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
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

    // If image file was uploaded
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
          error: cloudErr.message,
        });
      }
    }

    // If username is changed
    if (req.body.username) {
      user.username = req.body.username;
    }

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Profile updated", user });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
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
    const user = await User.findById(req.user.id); // From auth middleware

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

    // Send email notification
    await transporter.sendMail({
      from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Was Changed",
      text: `Hello ${user.username},\n\nThis is a confirmation that your password was successfully changed.\n\nIf this wasn't you, please contact us immediately.\n\n– SpenSyd Team`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};

export const sendResetCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Store code temporarily
    tempUsers[email] = {
      resetCode: verificationCode,
      codeExpires,
    };

    await transporter.sendMail({
      from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "SpenSyd Password Reset Code",
      text: `Hi ${user.username},\n\nYou requested to reset your SpenSyd password. Use the code below:\n\n🔐 Code: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn’t request this, you can ignore this email.\n\n– SpenSyd Team`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Reset code sent to email" });
  } catch (error) {
    console.error("sendResetCode error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  const entry = tempUsers[email];

  try {
    if (!entry || entry.resetCode !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    if (entry.codeExpires < Date.now()) {
      delete tempUsers[email];
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired" });
    }

    return res.status(200).json({ success: true, message: "Code verified" });
  } catch (error) {
    console.error("verifyResetCode error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    // Remove from temp store
    delete tempUsers[email];

    // Send email
    await transporter.sendMail({
      from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your SpenSyd Password Was Changed",
      text: `Hi ${user.username},\n\nThis is a confirmation that your password has been successfully reset.\n\nIf you didn’t request this, please contact us immediately.\n\n– SpenSyd Team`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
