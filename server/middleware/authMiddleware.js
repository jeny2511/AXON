import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Authentication Middleware (protect)
 * Verifies JWT token from Authorization header (Bearer token)
 * Attaches the active authenticated User document to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers["x-access-token"]) {
    token = req.headers["x-access-token"];
  }

  // 2. Validate token existence
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route. Please provide a valid Bearer token.",
    });
  }

  try {
    // 3. Verify token signature and expiry
    const decoded = verifyToken(token);

    // 4. Retrieve user and verify account status
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: "The user account belonging to this token no longer exists.",
      });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is currently ${user.accountStatus}. Please contact the Lead Administrator.`,
      });
    }

    // 5. Attach active user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token. Authorization denied.",
    });
  }
};

export default { protect };
