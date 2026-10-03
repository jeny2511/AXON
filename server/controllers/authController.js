import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// In-memory server-side store for registration OTPs: email -> { otp, expiresAt }
export const registrationOtpStore = new Map();

/**
 * Send Server-Side Registration OTP
 * POST /api/auth/send-otp
 * Access: Public
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid college email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    // Generate cryptographic 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    registrationOtpStore.set(normalizedEmail, { otp, expiresAt });

    // Server console log for testing / viva demo visibility
    console.log(`🔑 [Server OTP] Generated registration OTP for ${normalizedEmail}: ${otp} (valid for 10m)`);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${normalizedEmail}. (Development code logged on server console)`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate OTP.",
    });
  }
};

/**
 * Student Registration
 * POST /api/auth/register
 * Access: Public | Allowed Role: None (Forces role: "student")
 */
export const registerStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      enrollmentNumber,
      enrollmentNo,
      password,
      confirmPassword,
      department,
      admissionType,
      courseType,
      batch,
      year,
      phoneNumber,
      phone,
      otp,
    } = req.body;

    const trimmedFullName = (fullName || "").trim();
    const trimmedEmail = (email || "").trim().toLowerCase();
    const trimmedEnrollment = (enrollmentNumber || enrollmentNo || "").trim().toUpperCase();
    const trimmedPhone = (phoneNumber || phone || "").trim();
    const resolvedAdmissionType = (admissionType || courseType || "regular").toLowerCase();

    // 1. Mandatory field validation
    if (!trimmedFullName || trimmedFullName.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Full name is required (minimum 3 characters).",
      });
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid college email address is required.",
      });
    }

    if (!trimmedEnrollment) {
      return res.status(400).json({
        success: false,
        message: "Enrollment number is required.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match.",
      });
    }

    if (!trimmedPhone || !/^[0-9]{10}$/.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid 10-digit number.",
      });
    }

    // 2. Server-side OTP validation
    if (otp) {
      const otpRecord = registrationOtpStore.get(trimmedEmail);
      if (!otpRecord || otpRecord.otp !== String(otp).trim() || Date.now() > otpRecord.expiresAt) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP. Please request a new OTP.",
        });
      }
      // OTP verified successfully; consume it
      registrationOtpStore.delete(trimmedEmail);
    }

    // 3. Uniqueness check
    const existing = await User.findOne({
      $or: [{ email: trimmedEmail }, { enrollmentNumber: trimmedEnrollment }],
      isDeleted: false,
    });

    if (existing) {
      const field = existing.email === trimmedEmail ? "email" : "enrollment number";
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists. Please sign in.`,
      });
    }

    // 4. Batch duration calculation
    let startYear, endYear;
    if (batch && typeof batch === "object" && batch.startYear && batch.endYear) {
      startYear = Number(batch.startYear);
      endYear = Number(batch.endYear);
    } else if (typeof batch === "string" && batch.includes("-")) {
      const parts = batch.split("-");
      startYear = parseInt(parts[0], 10);
      const rawEnd = parts[1].trim();
      endYear = rawEnd.length === 2 ? parseInt("20" + rawEnd, 10) : parseInt(rawEnd, 10);
    } else {
      const numericYear = Number(year) || (resolvedAdmissionType === "d2d" ? 2 : 1);
      const entryYear = resolvedAdmissionType === "d2d" ? 2 : 1;
      const yearsPassed = numericYear - entryYear;
      startYear = new Date().getFullYear() - yearsPassed;
      endYear = startYear + (resolvedAdmissionType === "d2d" ? 3 : 4);
    }

    // 5. Create Student User (Explicitly forcing role: "student")
    const newUser = await User.create({
      role: "student",
      fullName: trimmedFullName,
      email: trimmedEmail,
      password,
      enrollmentNumber: trimmedEnrollment,
      admissionType: resolvedAdmissionType === "d2d" ? "d2d" : "regular",
      department: (department || "IT").toUpperCase(),
      batch: { startYear, endYear },
      phoneNumber: trimmedPhone,
      profilePhoto: "",
      emailVerified: true,
      accountStatus: "active",
    });

    // 6. Generate JWT
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: "Student account created successfully.",
      data: {
        token,
        user: {
          _id: newUser._id,
          id: newUser._id,
          fullName: newUser.fullName,
          name: newUser.fullName,
          email: newUser.email,
          enrollmentNumber: newUser.enrollmentNumber,
          enrollmentNo: newUser.enrollmentNumber,
          role: newUser.role,
          department: newUser.department,
          admissionType: newUser.admissionType,
          currentYear: newUser.currentYear,
          year: newUser.year,
          semester: newUser.semester,
          batchDisplay: newUser.batchDisplay,
          phoneNumber: newUser.phoneNumber,
          phone: newUser.phoneNumber,
          profilePhoto: newUser.profilePhoto,
          accountStatus: newUser.accountStatus,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create account.",
    });
  }
};

/**
 * Unified Login (Student, Volunteer, Admin)
 * POST /api/auth/login
 * Access: Public | Allowed Role: None (Role resolved from DB)
 */
export const loginUser = async (req, res) => {
  try {
    const { identifier, username, email, enrollmentNumber, password } = req.body;
    const loginId = (identifier || username || email || enrollmentNumber || "").trim();

    if (!loginId) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Email ID or Enrollment Number.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your password.",
      });
    }

    // Find user by email OR enrollmentNumber
    const user = await User.findByLoginIdentifier(loginId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please verify your Email or Enrollment Number.",
      });
    }

    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact administrator.",
      });
    }

    if (user.accountStatus !== "active") {
      return res.status(401).json({
        success: false,
        message: `Account is currently ${user.accountStatus}. Access denied.`,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Incorrect password.",
      });
    }

    // Generate JWT encoding ONLY user ID
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Authenticated successfully.",
      data: {
        token,
        user: {
          _id: user._id,
          id: user._id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          enrollmentNumber: user.enrollmentNumber,
          enrollmentNo: user.enrollmentNumber,
          role: user.role,
          department: user.department,
          admissionType: user.admissionType,
          currentYear: user.currentYear,
          year: user.year,
          semester: user.semester,
          batchDisplay: user.batchDisplay,
          phoneNumber: user.phoneNumber,
          phone: user.phoneNumber,
          profilePhoto: user.profilePhoto,
          accountStatus: user.accountStatus,
          committeePosition: user.committeePosition,
          workingUnder: user.workingUnder,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during login.",
    });
  }
};

/**
 * Get Current Authenticated User
 * GET /api/auth/me
 * Access: Protected | Allowed Roles: student, volunteer, admin
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      message: "Current user profile fetched successfully.",
      data: {
        user: {
          _id: user._id,
          id: user._id,
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          enrollmentNumber: user.enrollmentNumber,
          enrollmentNo: user.enrollmentNumber,
          role: user.role,
          department: user.department,
          admissionType: user.admissionType,
          currentYear: user.currentYear,
          year: user.year,
          semester: user.semester,
          batchDisplay: user.batchDisplay,
          phoneNumber: user.phoneNumber,
          phone: user.phoneNumber,
          profilePhoto: user.profilePhoto,
          accountStatus: user.accountStatus,
          committeePosition: user.committeePosition,
          workingUnder: user.workingUnder,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user session.",
    });
  }
};

export default {
  sendOtp,
  registerStudent,
  loginUser,
  getMe,
};

