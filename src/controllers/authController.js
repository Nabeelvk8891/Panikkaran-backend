import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



/* REGISTER */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      emailOtp: otp,
      emailOtpExpires: Date.now() + 10 * 60 * 1000,
      emailOtpLastSent: Date.now(),
    });

    // 📧 Email HTML
    const html = `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 10 minutes</p>
    `;

    /* ✅ EMAIL SENDING (OWN TRY-CATCH) */
    try {
      await sendEmail(email, "Verify your email", html);
    } catch (emailError) {
      console.error("❌ EMAIL ERROR:", emailError);

      return res.status(500).json({
        message:
          "Unable to send verification email. Please try again later.",
      });
    }

    return res.status(201).json({
      message: "Registration successful. OTP sent to email.",
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};




/* VERIFY EMAIL */

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.json({
        message: "Email already verified",
      });
    }

    if (
      user.emailOtp !== otp ||
      user.emailOtpExpires < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // ✅ VERIFY USER
    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    user.emailOtpLastSent = undefined;
    await user.save();

    // 🔐 GENERATE JWT (SAME AS LOGIN)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Email verified successfully",
      token,
      user,
      role: user.role,
    });
  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({
      message: "OTP verification failed",
    });
  }
};


export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Email already verified",
      });
    }

    // 🔐 Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = otp;
    user.emailOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // 📧 Send OTP email
    const html = `
      <h2>Email Verification</h2>
      <p>Your new OTP is:</p>
      <h1 style="letter-spacing:5px">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `;

    await sendEmail(email, "Resend OTP - Verify your email", html);

    res.json({
      message: "OTP resent to your email",
    });
  } catch (err) {
    console.error("❌ RESEND OTP ERROR:", err);
    res.status(500).json({
      message: "Failed to resend OTP",
    });
  }
};

/* LOGIN */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // 🔒 BLOCKED USER CHECK (ADD THIS)
  if (user.isBlocked) {
    return res.status(403).json({
      message: "Your account has been blocked by admin",
      code: "USER_BLOCKED",
    });
  }

  if (user.provider === "google") {
    return res.status(400).json({ message: "Use Google login" });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(401).json({
      message: "Please verify your email",
    });
  }

  res.json({
    token: generateToken(user._id),
    role: user.role,
    user,
  });
};


/* GOOGLE LOGIN  */
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email, picture } = ticket.getPayload();

  let user = await User.findOne({ email });

  // 🔒 BLOCKED USER CHECK (EXISTING USER)
  if (user && user.isBlocked) {
    return res.status(403).json({
      message: "Your account has been blocked by admin",
      code: "USER_BLOCKED",
    });
  }

  if (!user) {
    user = await User.create({
      name,
      email,
      profileImage: picture,
      provider: "google",
      isVerified: true,
      role: email === "admin@panikkaran.com" ? "admin" : "user",
    });
  }

  res.json({
    token: generateToken(user._id),
    user,
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Google users must reset via Google
    if (user.provider === "google") {
      return res.status(400).json({
        code: "GOOGLE_ACCOUNT",
        message:
          "This account uses Google login. Please use Google to access your account.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>Click below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link is valid for 15 minutes.</p>
    `;

    await sendEmail(user.email, "Reset your password", html);

    res.json({
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Failed to send reset email",
    });
  }
};



export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successful. You can login now.",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({
      message: "Password reset failed",
    });
  }
};


