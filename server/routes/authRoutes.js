
import express from "express";
import {
  registerStudent,
  verifyEmail,
  setPassword,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginLimiter,
  registrationLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post("/register", registrationLimiter, registerStudent);
router.post("/verify-email", passwordResetLimiter, verifyEmail);
router.post("/set-password", passwordResetLimiter, setPassword);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.patch("/change-password", protect, passwordResetLimiter, changePassword);

export default router;