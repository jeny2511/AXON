import express from "express";
import {
  generateEventCertificates,
  getMyCertificates,
  getEventCertificates,
  checkEligibility,
  getCertificateById,
  verifyCertificate,
} from "../controllers/certificateController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Certificate Routes
 */
// Public / Authenticated verification
router.get("/verify/:code", verifyCertificate);

// Student certificate views & eligibility
router.get("/my", protect, authorizeRoles("student"), getMyCertificates);
router.get("/eligibility/:eventId", protect, authorizeRoles("student"), checkEligibility);

// Staff generation & event certificate listings
router.post("/generate/:eventId", protect, authorizeRoles("volunteer", "admin"), generateEventCertificates);
router.get("/event/:eventId", protect, authorizeRoles("volunteer", "admin"), getEventCertificates);

// Specific certificate lookup
router.get("/:id", protect, getCertificateById);

export default router;
