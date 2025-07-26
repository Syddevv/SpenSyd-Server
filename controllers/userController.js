// Temporary in-memory storage (for demo only, use Redis/db in prod)
const tempUsers = {};

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
        id: user._id,
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
