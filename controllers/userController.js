const tempUsers = {};

// Store change email flows: { userId: { step, currentEmailCode, newEmail, newEmailCode, expires } }
const tempChangeEmail = {};

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
    const { identifier, password } = req.body;

    console.log("📥 Login request received:", identifier);

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      console.log("❌ User not found");
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    if (!user.isVerified) {
      console.log("⚠️ User not verified");
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password does not match");
      return res
        .status(400)
        .json({ success: false, message: "Wrong Credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("✅ Login successful:", user.email);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("🔥 Server error during login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const verifyUser = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false });
  res.json({
    success: true,
    user: {
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture, // <-- this must be included
      // ...other fields
    },
  });
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

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "No account is connected to this email.",
    });
  }
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
  try {
    const { email, code } = req.body;

    // Normalize email case
    const normalizedEmail = email.toLowerCase();
    const entry = tempUsers[normalizedEmail];

    console.log("Verification attempt for:", normalizedEmail);
    console.log("Stored entry:", entry);
    console.log("Submitted code:", code);

    if (!entry) {
      return res.status(400).json({
        success: false,
        message: "No active verification request found",
      });
    }

    if (entry.codeExpires < Date.now()) {
      delete tempUsers[normalizedEmail];
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    if (entry.resetCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Code is valid - create a verification token
    const verificationToken = jwt.sign(
      { email: normalizedEmail, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    delete tempUsers[normalizedEmail]; // Prevent code reuse

    return res.status(200).json({
      success: true,
      token: verificationToken,
    });
  } catch (error) {
    console.error("Verification error:", error);
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

// Step 1: Send code to current email
export const sendCurrentEmailCode = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000;

  tempChangeEmail[userId] = { step: 1, currentEmailCode: code, expires };

  await transporter.sendMail({
    from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Verify your current email",
    text: `Your code: ${code}\n\nThis code expires in 15 minutes.`,
  });

  return res.json({
    success: true,
    message: "Verification code sent to current email.",
  });
};

// Step 2: Verify code from current email
export const verifyCurrentEmailCode = (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  const entry = tempChangeEmail[userId];
  if (!entry || entry.step !== 1 || entry.currentEmailCode !== code)
    return res.status(400).json({ success: false, message: "Invalid code" });
  if (entry.expires < Date.now()) {
    delete tempChangeEmail[userId];
    return res.status(400).json({ success: false, message: "Code expired" });
  }
  entry.step = 2;
  return res.json({ success: true, message: "Current email verified" });
};

// Step 3: Send code to new email
export const sendNewEmailCode = async (req, res) => {
  const userId = req.user.id;
  const { newEmail } = req.body;
  const entry = tempChangeEmail[userId];
  if (!entry || entry.step !== 2)
    return res
      .status(400)
      .json({ success: false, message: "Unauthorized flow" });

  // Check if new email is already used
  const exists = await User.findOne({ email: newEmail });
  if (exists)
    return res
      .status(400)
      .json({ success: false, message: "Email already in use" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000;

  entry.newEmail = newEmail;
  entry.newEmailCode = code;
  entry.newEmailExpires = expires;
  entry.step = 3;

  await transporter.sendMail({
    from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
    to: newEmail,
    subject: "Verify your new email",
    text: `Your code: ${code}\n\nThis code expires in 15 minutes.`,
  });

  return res.json({
    success: true,
    message: "Verification code sent to new email.",
  });
};

// Step 4: Verify code from new email and update
export const verifyNewEmailCodeAndUpdate = async (req, res) => {
  const userId = req.user.id;
  const { code } = req.body;
  const entry = tempChangeEmail[userId];
  if (!entry || entry.step !== 3 || entry.newEmailCode !== code)
    return res.status(400).json({ success: false, message: "Invalid code" });
  if (entry.newEmailExpires < Date.now()) {
    delete tempChangeEmail[userId];
    return res.status(400).json({ success: false, message: "Code expired" });
  }

  const user = await User.findById(userId);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const oldEmail = user.email;
  user.email = entry.newEmail;
  await user.save();

  // Notify both emails
  await transporter.sendMail({
    from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
    to: oldEmail,
    subject: "Your email was changed",
    text: `Your SpenSyd email was changed to ${entry.newEmail}. If this wasn't you, contact support.`,
  });
  await transporter.sendMail({
    from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
    to: entry.newEmail,
    subject: "Welcome to your new email",
    text: `Your SpenSyd email has been updated successfully.`,
  });

  delete tempChangeEmail[userId];
  return res.json({
    success: true,
    message: "Email updated successfully",
    newEmail: user.email,
  });
};

// In authController.js
export const sendResetCodeLoggedIn = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // No need to check email since we're using the logged-in user's email
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    tempUsers[user.email] = {
      resetCode: verificationCode,
      codeExpires,
    };

    await transporter.sendMail({
      from: `"SpenSyd" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "SpenSyd Password Reset Code",
      text: `Hi ${user.username},\n\nYou requested to reset your SpenSyd password. Use the code below:\n\n🔐 Code: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, you can ignore this email.\n\n– SpenSyd Team`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Reset code sent to email" });
  } catch (error) {
    console.error("sendResetCodeLoggedIn error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
