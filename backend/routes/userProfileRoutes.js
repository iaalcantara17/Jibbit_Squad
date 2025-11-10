import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  employment,
  skills,
  education,
  certifications,
  projects,
  basicInfo,
} from "../controllers/profileController.js";

const router = express.Router();

// Middleware ensures all routes are protected
router.use(verifyToken);

// === Basic Info ===
router.get("/me/basic-info", basicInfo.getAll);
router.post("/me/basic-info", basicInfo.create);
router.put("/me/basic-info/:id", basicInfo.update);
router.delete("/me/basic-info/:id", basicInfo.remove);

// === Employment ===
router.get("/me/employment", employment.getAll);
router.post("/me/employment", employment.create);
router.put("/me/employment/:id", employment.update);
router.delete("/me/employment/:id", employment.remove);

// === Skills ===
router.get("/me/skills", skills.getAll);
router.post("/me/skills", skills.create);
router.put("/me/skills/:id", skills.update);
router.delete("/me/skills/:id", skills.remove);

// === Education ===
router.get("/me/education", education.getAll);
router.post("/me/education", education.create);
router.put("/me/education/:id", education.update);
router.delete("/me/education/:id", education.remove);

// === Certifications ===
router.get("/me/certifications", certifications.getAll);
router.post("/me/certifications", certifications.create);
router.put("/me/certifications/:id", certifications.update);
router.delete("/me/certifications/:id", certifications.remove);

// === Projects ===
router.get("/me/projects", projects.getAll);
router.post("/me/projects", projects.create);
router.put("/me/projects/:id", projects.update);
router.delete("/me/projects/:id", projects.remove);

export default router;

