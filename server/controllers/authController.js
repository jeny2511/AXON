
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email service is not configured");
  }

  const transporter = createEmailTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRawToken = () => crypto.randomBytes(32).toString("hex");

const createAuthToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Student registration: no password at this stage.
export const registerStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      enrollmentNo,
      department,
      year,
      semester,
      batch,
      phone,
    } = req.body;

    if (!fullName || !email || !enrollmentNo) {
      return res.status(400).json({
        message: "Name, email, and enrollment number are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEnrollment = enrollmentNo.trim();

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { enrollmentNo: normalizedEnrollment },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: "An account with these details already exists",
      });
    }

    const rawToken = createRawToken();

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      enrollmentNo: normalizedEnrollment,
      department,
      year,
      semester,
      batch,
      phone,
      role: "student",
      emailVerificationToken: hashToken(rawToken),
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000),
    });

    const verificationLink =
      `${FRONTEND_URL}/verify-email?token=${rawToken}`;

    try {
      await sendEmail(
        normalizedEmail,
        "Verify your AXON account",
        `<p>Hello ${user.fullName},</p>
         <p>Verify your email to continue setting up your AXON account.</p>
         <p><a href="${verificationLink}">Verify email</a></p>
         <p>This link expires in 30 minutes.</p>`
      );
    } catch (emailError) {
      await User.deleteOne({ _id: user._id });
      throw emailError;
    }

    return res.status(201).json({
      message: "Registration successful. Check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Unable to complete registration",
    });
  }
};

// Verify email and issue a short-lived password setup token.
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Verification link is invalid or expired",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const setupToken = jwt.sign(
      { id: user._id, purpose: "set-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      message: "Email verified. Set your password to continue.",
      setupToken,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Email verification failed" });
  }
};

// Set the first password after email verification.
export const setPassword = async (req, res) => {
  try {
    const { setupToken, password } = req.body;

    if (!setupToken || !password || password.length < 8) {
      return res.status(400).json({
        message: "A valid setup token and password of at least 8 characters are required",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Password setup session is invalid or expired",
      });
    }

    if (decoded.purpose !== "set-password") {
      return res.status(400).json({ message: "Invalid setup session" });
    }

    const user = await User.findById(decoded.id).select("+password");

    if (!user || !user.isEmailVerified || user.password) {
      return res.status(400).json({
        message: "Password setup is not available for this account",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    return res.json({ message: "Password created successfully. You can now log in." });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({ message: "Unable to set password" });
  }
};

// Login for all roles. Role is checked on the backend.
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and portal role are required",
      });
    }

    if (!["student", "volunteer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid portal role" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role,
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account is inactive" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const authToken = createAuthToken(user);

    return res.json({
      message: "Login successful",
      token: authToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to log in" });
  }
};

// Request a password reset email.
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      isEmailVerified: true,
      isActive: true,
    });

    // Generic response avoids revealing whether an account exists.
    const response = {
      message: "If the account exists, a password reset email will be sent.",
    };

    if (!user) return res.json(response);

    const rawToken = createRawToken();

    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

    try {
      await sendEmail(
        user.email,
        "Reset your AXON password",
        `<p>Hello ${user.fullName},</p>
         <p>Use the link below to reset your password.</p>
         <p><a href="${resetLink}">Reset password</a></p>
         <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>`
      );
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw emailError;
    }

    return res.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Unable to process the request" });
  }
};

// Complete a password reset using the emailed token.
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || password.length < 8) {
      return res.status(400).json({
        message: "A valid reset token and password of at least 8 characters are required",
      });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or expired",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
};

// Change password for an authenticated user.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Current password and a new password of at least 8 characters are required",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user || !user.password) {
      return res.status(404).json({ message: "Account not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);

    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Unable to change password" });
  }
};

export default {
  registerStudent,
  verifyEmail,
  setPassword,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
};