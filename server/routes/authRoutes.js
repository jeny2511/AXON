import express from "express";
import {
  login,
  registerStudent,
  sendOTP,
  verifyOTP,
  getRegistrationOptions,
  getMe,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Unified login for Student, Volunteer, Admin
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/register-student
 * @desc    Student self-registration
 * @access  Public
 */
router.post("/register-student", registerStudent);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send 6-digit OTP for email verification
 * @access  Public
 */
router.post("/send-otp", sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify 6-digit OTP
 * @access  Public
 */
router.post("/verify-otp", verifyOTP);

/**
 * @route   GET /api/auth/registration-options
 * @desc    Fetch active non-graduated academic batches and years (Regular vs D2D)
 * @access  Public
 */
router.get("/registration-options", getRegistrationOptions);

/**
 * @route   GET /api/auth/me
 * @desc    Fetch authenticated user profile
 * @access  Protected (Requires Bearer Token)
 */
router.get("/me", protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout / terminate session
 * @access  Public
 */
router.post("/logout", logout);

export default router;
