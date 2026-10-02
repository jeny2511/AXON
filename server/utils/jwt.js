import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "axon_super_secret_jwt_key_2026_gtu_vgec";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "30d";

/**
 * Generates a signed JWT for the authenticated user
 * @param {Object} user - User document
 * @returns {String} JSON Web Token
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      enrollmentNumber: user.enrollmentNumber || null,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE,
    }
  );
};

/**
 * Verifies a given JWT
 * @param {String} token - Raw JWT string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Standardized auth response helper
 * Attaches token and returns sanitized user payload
 */
export const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user);

  // Sanitized user profile payload
  const userPayload = {
    id: user._id,
    _id: user._id,
    role: user.role,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    enrollmentNumber: user.enrollmentNumber || "",
    enrollmentNo: user.enrollmentNumber || "",
    department: user.department || "",
    admissionType: user.admissionType || "regular",
    courseType: user.admissionType === "d2d" ? "D2D" : "Regular",
    batch: user.batchDisplay || (user.batch?.startYear ? `${user.batch.startYear}-${user.batch.endYear}` : ""),
    batchDetails: user.batch || null,
    currentYear: user.currentYear || null,
    year: user.year || (user.currentYear ? `${user.currentYear}th Year` : ""),
    semester: user.semester || null,
    phoneNumber: user.phoneNumber || "",
    phone: user.phoneNumber || "",
    profilePhoto: user.profilePhoto || "",
    committeePosition: user.committeePosition || null,
    accountStatus: user.accountStatus || "active",
  };

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userPayload,
  });
};

export default {
  generateToken,
  verifyToken,
  sendTokenResponse,
};
