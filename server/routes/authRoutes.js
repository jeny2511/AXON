import express from "express";
import {
  sendOtp,
  registerStudent,
  loginUser,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Authentication Endpoints
 */
router.post("/send-otp", sendOtp);
router.post("/register", registerStudent);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;

