import jwt from "jsonwebtoken";

/**
 * Generate JWT Authentication Token
 * Assigned to: Archi
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "axon_jwt_secret_dev", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

export default generateToken;
