import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly resolve server/.env
dotenv.config({ path: path.resolve(__dirname, ".env") });

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AXON Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount Module Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Central Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 [Server] AXON Backend running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

export default app;
