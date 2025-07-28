import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../Models/User.models.js";
import { transporter } from "../DB/nodemailer.js";

import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing details" });
    }
    if (role && !["user", "vendor"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      /* existing options */
    });

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to FoodFinder",
      text: `Hello ${name}, welcome to FoodFinder!`,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: { name, role: newUser.role },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all details" });
    }

    const user = await UserModel.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      /* existing options */
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token, // Include token in response body
      user: { name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });

  return res.status(200).json({ success: true, message: "User logged out" });
};

export const verifyOtpChangePassword = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user?.id;
  console.log("Received OTP:", otp, "User ID:", userId); // Debug log

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "Missing Details" });
  }

  try {
    const User = await UserModel.findById(userId);
    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("Stored OTP:", User.verifyOtp, "Provided OTP:", otp); // Debug log

    if (!User.resetOTP || User.resetOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    console.log(
      "OTP Expiration:",
      User.verifyOtpExpiredAt,
      "Current Time:",
      Date.now()
    ); // Debug log

    if (User.resetOTPExpiredAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    User.isEmailVerified = true;
    User.resetOTP = "";
    User.resetOTPExpiredAt = "";
    await User.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP verified Successfully" });
  } catch (err) {
    console.error("Server Error:", err); // Debug log
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const verifyEmailChangePassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const User = await UserModel.findOne({ email });

    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    User.resetOTP = otp;
    User.resetOTPExpiredAt = Date.now() + 15 * 60 * 1000;
    await User.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Account Verification OTP",
      text: `Your OTP for resetting your password is ${otp}.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("OTP Send Error:", error); // 👈 helpful for debugging
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetNewPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.id;

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "new password are required" });
    }

    const User = await UserModel.findById(userId);

    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "Please enter the correct email!" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10); //;encrypt new password
    User.password = hashedNewPassword;

    await User.save(); //save the new password

    return res.status(200).json({
      success: true,
      message: "Password has been changed successfully",
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
