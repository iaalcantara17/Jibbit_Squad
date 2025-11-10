import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getResumes,
  getResume,
  createResume,
  updateResume,
  deleteResume,
  generateContent,
  optimizeSkillsForJob,
  tailorExperienceForJob,
  createVersion,
  restoreVersion,
  setDefaultResume,
} from "../controllers/resumeController.js";

const router = express.Router();

// All resume routes require authentication
router.use(verifyToken);

// Resume CRUD
router.get("/", getResumes);
router.get("/:id", getResume);
router.post("/", createResume);
router.put("/:id", updateResume);
router.delete("/:id", deleteResume);

// AI features
router.post("/:id/generate-content", generateContent);
router.post("/:id/optimize-skills", optimizeSkillsForJob);
router.post("/:id/tailor-experience", tailorExperienceForJob);

// Version management
router.post("/:id/versions", createVersion);
router.post("/:id/restore/:versionId", restoreVersion);

// Default resume
router.post("/:id/set-default", setDefaultResume);

export default router;
