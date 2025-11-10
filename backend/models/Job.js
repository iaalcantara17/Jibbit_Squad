import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Job Status Pipeline Stages
const JOB_STATUSES = [
  "Interested",
  "Applied", 
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected"
];

// Job Types
const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance"
];

// Application Materials sub-schema
const applicationMaterialSchema = new mongoose.Schema({
  resumeId: String,
  resumeName: String,
  coverLetterId: String,
  coverLetterName: String,
  appliedDate: Date,
}, { _id: false });

// Contact Information sub-schema
const contactSchema = new mongoose.Schema({
  name: String,
  role: String, // e.g., "Recruiter", "Hiring Manager"
  email: String,
  phone: String,
  notes: String,
}, { _id: false });

// Status History Entry
const statusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: JOB_STATUSES },
  changedAt: { type: Date, default: Date.now },
  notes: String,
}, { _id: false });

// Company Information sub-schema
const companyInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: String, // e.g., "1-50", "51-200", "201-500", "501-1000", "1000+"
  industry: String,
  location: String,
  website: String,
  description: String,
  logoUrl: String,
  glassdoorRating: Number,
}, { _id: false });

// Main Job Schema
const jobSchema = new mongoose.Schema({
  job_id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true,
    ref: 'User'
  },
  
  // Basic Job Information
  jobTitle: {
    type: String,
    required: true,
    maxlength: 200
  },
  company: companyInfoSchema,
  location: String,
  
  // Job Details
  jobType: {
    type: String,
    enum: JOB_TYPES,
    default: "Full-time"
  },
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: {
    type: String,
    default: "USD"
  },
  
  // Job Description & URL
  jobDescription: {
    type: String,
    maxlength: 5000
  },
  jobUrl: String,
  
  // Status Management
  status: {
    type: String,
    enum: JOB_STATUSES,
    default: "Interested",
    index: true
  },
  statusHistory: [statusHistorySchema],
  
  // Dates
  applicationDeadline: Date,
  appliedDate: Date,
  
  // Application Materials
  applicationMaterials: applicationMaterialSchema,
  
  // Notes & Tracking
  notes: String,
  interviewNotes: String,
  salaryNegotiationNotes: String,
  
  // Contacts
  contacts: [contactSchema],
  
  // Archiving
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  archiveReason: String,
  archivedAt: Date,
  
  // Import tracking
  importedFrom: String, // URL if imported from job board
  
}, { 
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for common queries
jobSchema.index({ user_id: 1, status: 1 });
jobSchema.index({ user_id: 1, isArchived: 1 });
jobSchema.index({ user_id: 1, applicationDeadline: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for days in current stage
jobSchema.virtual('daysInStage').get(function() {
  if (this.statusHistory && this.statusHistory.length > 0) {
    const lastStatusChange = this.statusHistory[this.statusHistory.length - 1].changedAt;
    const now = new Date();
    const diffTime = Math.abs(now - lastStatusChange);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  // If no history, calculate from createdAt
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for deadline urgency
jobSchema.virtual('deadlineUrgency').get(function() {
  if (!this.applicationDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline < 0) return 'overdue';
  if (daysUntilDeadline <= 3) return 'urgent';
  if (daysUntilDeadline <= 7) return 'soon';
  return 'normal';
});

// Method to update status with history tracking
jobSchema.methods.updateStatus = function(newStatus, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    notes
  });
  return this.save();
};

// Method to archive job
jobSchema.methods.archive = function(reason = '') {
  this.isArchived = true;
  this.archiveReason = reason;
  this.archivedAt = new Date();
  return this.save();
};

// Method to unarchive job
jobSchema.methods.unarchive = function() {
  this.isArchived = false;
  this.archiveReason = undefined;
  this.archivedAt = undefined;
  return this.save();
};

// Ensure virtuals are included in JSON
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

export default mongoose.model("Job", jobSchema);
