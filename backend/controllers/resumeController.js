import Resume from "../models/Resume.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { generateResumeContent, optimizeSkills, tailorExperience } from "../services/aiService.js";

// GET /api/resumes - Get all resumes for user
export const getResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isArchived } = req.query;

    const query = { user_id: userId };
    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }

    const resumes = await Resume.find(query).sort({ createdAt: -1 });
    return successResponse(res, 200, resumes, "Resumes retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// GET /api/resumes/:id - Get single resume
export const getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }
    
    return successResponse(res, 200, resume, "Resume retrieved");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes - Create new resume
export const createResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const resumeData = req.body;

    if (!resumeData.title) {
      return errorResponse(res, 400, "Resume title is required", ["title"]);
    }

    // Get user profile data to populate initial sections
    const user = await User.findOne({ user_id: userId });
    
    // Build initial sections from user profile
    const sections = [
      {
        type: "header",
        title: "Contact Information",
        content: {
          name: user.name,
          email: user.email,
          phone: user.basicInfo?.[0]?.phoneNumber,
          location: user.basicInfo?.[0]?.location,
        },
        order: 0,
        isVisible: true
      },
      {
        type: "summary",
        title: "Professional Summary",
        content: {
          text: user.basicInfo?.[0]?.bio || ""
        },
        order: 1,
        isVisible: true
      },
      {
        type: "experience",
        title: "Work Experience",
        content: {
          entries: user.employmentHistory || []
        },
        order: 2,
        isVisible: true
      },
      {
        type: "education",
        title: "Education",
        content: {
          entries: user.education || []
        },
        order: 3,
        isVisible: true
      },
      {
        type: "skills",
        title: "Skills",
        content: {
          entries: user.skills || []
        },
        order: 4,
        isVisible: true
      },
    ];

    // Add projects if user has any
    if (user.projects && user.projects.length > 0) {
      sections.push({
        type: "projects",
        title: "Projects",
        content: {
          entries: user.projects
        },
        order: 5,
        isVisible: true
      });
    }

    // Add certifications if user has any
    if (user.certifications && user.certifications.length > 0) {
      sections.push({
        type: "certifications",
        title: "Certifications",
        content: {
          entries: user.certifications
        },
        order: 6,
        isVisible: true
      });
    }

    const resume = await Resume.create({
      ...resumeData,
      user_id: userId,
      sections: resumeData.sections || sections
    });

    return successResponse(res, 201, resume, "Resume created");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// PUT /api/resumes/:id - Update resume
export const updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        resume[key] = updateData[key];
      }
    });

    await resume.save();
    
    return successResponse(res, 200, resume, "Resume updated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// DELETE /api/resumes/:id - Delete resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOneAndDelete({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }
    
    return successResponse(res, 200, null, "Resume deleted");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/generate-content - AI generate resume content
export const generateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { jobId, sections } = req.body;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    // Get user profile and job details
    const user = await User.findOne({ user_id: userId });
    
    let jobData = null;
    if (jobId) {
      const Job = mongoose.model('Job');
      jobData = await Job.findOne({ job_id: jobId, user_id: userId });
    }

    // Generate AI content
    const generatedContent = await generateResumeContent(user, jobData, sections);

    // Update resume with generated content
    resume.aiGenerated = {
      lastGenerated: new Date(),
      model: "gpt-4o-mini",
      tailoredForJob: jobId || null,
      prompt: `Generated content for sections: ${sections.join(', ')}`
    };

    await resume.save();

    return successResponse(res, 200, generatedContent, "Content generated");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/optimize-skills - AI optimize skills for job
export const optimizeSkillsForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { jobId } = req.body;

    if (!jobId) {
      return errorResponse(res, 400, "Job ID is required", ["jobId"]);
    }

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    // Get job and user data
    const Job = mongoose.model('Job');
    const job = await Job.findOne({ job_id: jobId, user_id: userId });
    const user = await User.findOne({ user_id: userId });

    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    // Optimize skills using AI
    const optimizedSkills = await optimizeSkills(user.skills, job);

    return successResponse(res, 200, optimizedSkills, "Skills optimized");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/tailor-experience - AI tailor experience for job
export const tailorExperienceForJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { jobId } = req.body;

    if (!jobId) {
      return errorResponse(res, 400, "Job ID is required", ["jobId"]);
    }

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    // Get job and user data
    const Job = mongoose.model('Job');
    const job = await Job.findOne({ job_id: jobId, user_id: userId });
    const user = await User.findOne({ user_id: userId });

    if (!job) {
      return errorResponse(res, 404, "Job not found");
    }

    // Tailor experience using AI
    const tailoredExperience = await tailorExperience(user.employmentHistory, job);

    return successResponse(res, 200, tailoredExperience, "Experience tailored");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/versions - Create version snapshot
export const createVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { versionName, tailoredForJob, notes } = req.body;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    await resume.createVersion(versionName, tailoredForJob, notes);
    
    return successResponse(res, 201, resume, "Version created");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/restore/:versionId - Restore from version
export const restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    await resume.restoreVersion(versionId);
    
    return successResponse(res, 200, resume, "Version restored");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};

// POST /api/resumes/:id/set-default - Set as default resume
export const setDefaultResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const resume = await Resume.findOne({ resume_id: id, user_id: userId });
    
    if (!resume) {
      return errorResponse(res, 404, "Resume not found");
    }

    resume.isDefault = true;
    await resume.save();
    
    return successResponse(res, 200, resume, "Default resume set");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "Server error");
  }
};
