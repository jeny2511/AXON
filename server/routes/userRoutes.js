import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get currently logged-in user profile
 * @access  Protected
 */
router.get("/profile", protect, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile (photo, phone, department)
 * @access  Protected
 */
router.put("/profile", protect, updateProfile);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change password with current password verification
 * @access  Protected
 */
router.put("/change-password", protect, changePassword);

/**
 * @route   GET /api/users
 * @desc    Get all users with search, role filters, and pagination
 * @access  Admin Only
 */
router.get("/", protect, isAdmin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID or enrollment number
 * @access  Protected
 */
router.get("/:id", protect, getUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft-delete a user
 * @access  Admin Only
 */
router.delete("/:id", protect, isAdmin, deleteUser);

export default router;
