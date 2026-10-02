/**
 * Role-Based Authorization Middleware
 * Restricts route access based on user role (student, volunteer, admin)
 */

/**
 * Restricts access to one or more allowed roles
 * @param  {...String} roles - e.g. "admin", "volunteer", "student"
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(", ")}].`,
      });
    }

    next();
  };
};

// Aliases for convenience
export const authorize = authorizeRoles;
export const isAdmin = authorizeRoles("admin");
export const isVolunteer = authorizeRoles("volunteer");
export const isStudent = authorizeRoles("student");
export const isVolunteerOrAdmin = authorizeRoles("volunteer", "admin");

export default {
  authorizeRoles,
  authorize,
  isAdmin,
  isVolunteer,
  isStudent,
  isVolunteerOrAdmin,
};
