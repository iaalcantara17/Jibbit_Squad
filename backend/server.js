import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import { MONGO_URI } from "./config.js";
import passport from "passport";

const app = express();
app.use(cors());
app.use(express.json());

// --- HARDCODED CONFIG (DEV ONLY) ---
const PORT = 5000;
// -----------------------------------

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Test route
app.get("/api/healthcheck", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// Google Oauth
app.use(passport.initialize());
app.use("/api/auth", authRoutes);

// Authentication route
app.use("/api/auth", authRoutes);
// User profile routes
app.use("/api/users", userRoutes);
app.use("/api/users", userProfileRoutes);
// Job management routes (Sprint 2)
app.use("/api/jobs", jobRoutes);
// Resume management routes (Sprint 2 - AI)
app.use("/api/resumes", resumeRoutes);

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

