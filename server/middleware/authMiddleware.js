import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication Middleware
 * Verifies Bearer JWT token, loads the active user from MongoDB,
 * and attaches the sanitized user document to req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, invalid token format",
        });
      }

      // Verify JWT signature using configured secret
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "axon_jwt_secret_dev"
      );

      // Load active, non-deleted user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found",
        });
      }

      if (user.isDeleted) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user account has been deleted",
        });
      }

      if (user.accountStatus !== "active") {
        return res.status(401).json({
          success: false,
          message: "Not authorized, account is not active",
        });
      }

      // Attach authoritative database user to request
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Not authorized, no token provided",
  });
};

export default { protect };

