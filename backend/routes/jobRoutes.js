import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  archiveJob,
  unarchiveJob,
  getJobStats,
  importJobFromUrl,
  bulkUpdateStatus
} from "../controllers/jobController.js";

const router = express.Router();

// All job routes require authentication
router.use(verifyToken);

// Job CRUD
router.get("/", getJobs);
router.get("/stats/summary", getJobStats);
router.get("/:id", getJob);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Job actions
router.post("/:id/archive", archiveJob);
router.post("/:id/unarchive", unarchiveJob);
router.post("/import", importJobFromUrl);
router.post("/bulk-status", bulkUpdateStatus);

export default router;
