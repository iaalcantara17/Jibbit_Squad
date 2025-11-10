import Job from "../models/Job.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// GET /api/jobs - Get all jobs for user with filtering
export const getJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, isArchived, search, sortBy, sortOrder } = req.query;

    // Build query
    const query = { user_id: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }
    
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort = { createdAt: -1 }; // Default: newest first
    }

    const jobs = await Job.find(query).sort(sort);
    
    return successResponse(res, 200, jobs, "Jobs retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// GET /api/jobs/:id - Get single job
export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await Job.findOne({ job_id: id, user_id: userId });
    
    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }
    
    return successResponse(res, 200, job, "Job retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/jobs - Create new job
export const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobData = req.body;

    // Validate required fields
    if (!jobData.jobTitle || !jobData.company?.name) {
      return errorResponse(res, 400, "Job title and company name are required", ["jobTitle", "company"]);
    }

    // Create job with user_id
    const job = await Job.create({
      ...jobData,
      user_id: userId,
      statusHistory: [{
        status: jobData.status || "Interested",
        changedAt: new Date(),
        notes: "Job created"
      }]
    });

    return successResponse(res, 201, job, "Job created");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// PUT /api/jobs/:id - Update job
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const job = await Job.findOne({ job_id: id, user_id: userId });
    
    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    // If status is being updated, use the updateStatus method
    if (updateData.status && updateData.status !== job.status) {
      await job.updateStatus(updateData.status, updateData.statusNotes || '');
      delete updateData.status;
      delete updateData.statusNotes;
    }

    // Update other fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        job[key] = updateData[key];
      }
    });

    await job.save();
    
    return successResponse(res, 200, job, "Job updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// DELETE /api/jobs/:id - Delete job permanently
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await Job.findOneAndDelete({ job_id: id, user_id: userId });
    
    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }
    
    return successResponse(res, 200, null, "Job deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/jobs/:id/archive - Archive job
export const archiveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;

    const job = await Job.findOne({ job_id: id, user_id: userId });
    
    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    await job.archive(reason);
    
    return successResponse(res, 200, job, "Job archived");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/jobs/:id/unarchive - Unarchive job
export const unarchiveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await Job.findOne({ job_id: id, user_id: userId });
    
    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    await job.unarchive();
    
    return successResponse(res, 200, job, "Job unarchived");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// GET /api/jobs/stats/summary - Get job statistics
export const getJobStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all active jobs
    const jobs = await Job.find({ user_id: userId, isArchived: false });

    // Calculate statistics
    const stats = {
      total: jobs.length,
      byStatus: {
        interested: jobs.filter(j => j.status === 'Interested').length,
        applied: jobs.filter(j => j.status === 'Applied').length,
        phoneScreen: jobs.filter(j => j.status === 'Phone Screen').length,
        interview: jobs.filter(j => j.status === 'Interview').length,
        offer: jobs.filter(j => j.status === 'Offer').length,
        rejected: jobs.filter(j => j.status === 'Rejected').length,
      },
      upcomingDeadlines: jobs
        .filter(j => j.applicationDeadline && new Date(j.applicationDeadline) > new Date())
        .sort((a, b) => new Date(a.applicationDeadline) - new Date(b.applicationDeadline))
        .slice(0, 5)
        .map(j => ({
          jobId: j.job_id,
          jobTitle: j.jobTitle,
          company: j.company.name,
          deadline: j.applicationDeadline,
          daysUntil: Math.ceil((new Date(j.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24))
        })),
      recentActivity: jobs
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map(j => ({
          jobId: j.job_id,
          jobTitle: j.jobTitle,
          company: j.company.name,
          status: j.status,
          updatedAt: j.updatedAt
        }))
    };

    return successResponse(res, 200, stats, "Job statistics retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/jobs/import - Import job from URL (placeholder for future implementation)
export const importJobFromUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return errorResponse(res, 400, "URL is required", ["url"]);
    }

    // TODO: Implement web scraping for job boards
    // For now, return a placeholder response
    return successResponse(res, 200, {
      jobTitle: "Imported Job Title",
      company: { name: "Company Name" },
      jobDescription: "Job description extracted from URL...",
      jobUrl: url,
      importedFrom: url
    }, "Job import feature coming soon. Please enter details manually.");
    
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/jobs/bulk-status - Bulk update job statuses
export const bulkUpdateStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobIds, status, notes } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return errorResponse(res, 400, "Job IDs array is required", ["jobIds"]);
    }

    if (!status) {
      return errorResponse(res, 400, "Status is required", ["status"]);
    }

    const jobs = await Job.find({ job_id: { $in: jobIds }, user_id: userId });

    const updatePromises = jobs.map(job => job.updateStatus(status, notes || ''));
    await Promise.all(updatePromises);

    return successResponse(res, 200, { updated: jobs.length }, "Jobs updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};
