import express from "express";
import {
  getLearningResources,
  getLearningResourceById,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
} from "../controllers/learningController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET all learning resources: student, volunteer, admin
router.get("/", protect, getLearningResources);

// GET single learning resource: student, volunteer, admin
router.get("/:id", protect, getLearningResourceById);

// POST create learning resource: volunteer, admin
router.post("/", protect, authorizeRoles("volunteer", "admin"), createLearningResource);

// PUT update learning resource: volunteer, admin
router.put("/:id", protect, authorizeRoles("volunteer", "admin"), updateLearningResource);

// DELETE soft-delete learning resource: volunteer, admin
router.delete("/:id", protect, authorizeRoles("volunteer", "admin"), deleteLearningResource);

export default router;
