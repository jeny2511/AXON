/**
 * Role-Based Authorization Middleware
 * Restricts route access based on the authoritative user role loaded in req.user.
 * Requires protect middleware to run first.
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Insufficient permissions for role '${req.user.role}'`,
      });
    }

    return next();
  };
};

export default { authorizeRoles };

