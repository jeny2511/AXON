import express from "express";
import {
  verifyCertificate,
  getMyCertificates,
  getCertificateById,
  issueCertificatesForEvent,
  getEventCertificates,
  getTemplate,
  updateTemplate,
} from "../controllers/certificateController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/certificates/verify/:code
 * @desc    Public verification of a certificate by its unique code (No login required)
 * @access  Public
 */
router.get("/verify/:code", verifyCertificate);

/**
 * @route   GET /api/certificates/my-certificates
 * @desc    Get all certificates earned by the logged-in student (with feedback lock status)
 * @access  Protected (Student)
 */
router.get("/my-certificates", protect, getMyCertificates);

/**
 * @route   GET /api/certificates/template
 * @desc    Get the active certificate background template
 * @access  Protected
 */
router.get("/template", protect, getTemplate);

/**
 * @route   PUT /api/certificates/template
 * @desc    Update certificate template
 * @access  Admin Only
 */
router.put("/template", protect, isAdmin, updateTemplate);

/**
 * @route   POST /api/certificates/issue/:eventId
 * @desc    Bulk-issue certificates for all students who attended an event
 * @access  Volunteer & Admin Only
 */
router.post("/issue/:eventId", protect, isVolunteerOrAdmin, issueCertificatesForEvent);

/**
 * @route   GET /api/certificates/event/:eventId
 * @desc    Get all issued certificates for an event
 * @access  Volunteer & Admin Only
 */
router.get("/event/:eventId", protect, isVolunteerOrAdmin, getEventCertificates);

/**
 * @route   GET /api/certificates/:id
 * @desc    Get single certificate details & verify lock status
 * @access  Protected
 */
router.get("/:id", protect, getCertificateById);

export default router;
