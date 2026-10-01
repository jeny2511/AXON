/**
 * Authentication Middleware
 * Assigned to: Jeny / Archi
 * Verifies JWT tokens and attaches authenticated user to req.user
 */
export const protect = async (req, res, next) => {
  // Authentication logic to be implemented by Jeny / Archi
  next();
};

export default { protect };
