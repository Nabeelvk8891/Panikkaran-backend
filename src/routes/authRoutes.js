import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/google", googleLogin);
router.post("/resend-email-otp", resendEmailOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
