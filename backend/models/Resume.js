import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Resume Template Types
const TEMPLATE_TYPES = ["chronological", "functional", "hybrid", "modern", "classic"];

// Resume Section Schema
const resumeSectionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  type: {
    type: String,
    enum: ["header", "summary", "experience", "education", "skills", "projects", "certifications", "custom"],
    required: true
  },
  title: String,
  content: mongoose.Schema.Types.Mixed, // Flexible content structure
  order: Number,
  isVisible: { type: Boolean, default: true },
}, { _id: false });

// Resume Version Schema
const resumeVersionSchema = new mongoose.Schema({
  version_id: { type: String, default: uuidv4 },
  versionName: String,
  createdAt: { type: Date, default: Date.now },
  sections: [resumeSectionSchema],
  tailoredFor: String, // job_id if tailored for specific job
  notes: String,
}, { _id: false });

// Main Resume Schema
const resumeSchema = new mongoose.Schema({
  resume_id: {
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
  
  // Resume Info
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  template: {
    type: String,
    enum: TEMPLATE_TYPES,
    default: "chronological"
  },
  
  // Current Content
  sections: [resumeSectionSchema],
  
  // Styling Options
  styling: {
    fontSize: { type: Number, default: 11 },
    fontFamily: { type: String, default: "Arial" },
    colorScheme: { type: String, default: "default" },
    margins: { type: Number, default: 1 }, // inches
    lineSpacing: { type: Number, default: 1.15 },
  },
  
  // Version History
  versions: [resumeVersionSchema],
  
  // Job Association
  linkedJobs: [{
    job_id: String,
    linkedAt: Date,
  }],
  
  // AI Generation Metadata
  aiGenerated: {
    lastGenerated: Date,
    model: String,
    prompt: String,
    tailoredForJob: String,
  },
  
  // Status
  isDefault: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  
  // Analytics
  stats: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: Date,
    successRate: { type: Number, default: 0 }, // Based on application outcomes
  },
  
}, { 
  timestamps: true 
});

// Indexes
resumeSchema.index({ user_id: 1, isArchived: 1 });
resumeSchema.index({ user_id: 1, isDefault: 1 });
resumeSchema.index({ createdAt: -1 });

// Method to create version snapshot
resumeSchema.methods.createVersion = function(versionName, tailoredForJob = null, notes = '') {
  const version = {
    version_id: uuidv4(),
    versionName: versionName || `Version ${this.versions.length + 1}`,
    createdAt: new Date(),
    sections: JSON.parse(JSON.stringify(this.sections)), // Deep copy
    tailoredFor: tailoredForJob,
    notes
  };
  
  this.versions.push(version);
  return this.save();
};

// Method to restore from version
resumeSchema.methods.restoreVersion = function(versionId) {
  const version = this.versions.find(v => v.version_id === versionId);
  if (!version) throw new Error('Version not found');
  
  this.sections = JSON.parse(JSON.stringify(version.sections));
  return this.save();
};

// Method to track usage
resumeSchema.methods.trackUsage = function(jobId) {
  this.stats.timesUsed += 1;
  this.stats.lastUsed = new Date();
  
  if (jobId && !this.linkedJobs.some(j => j.job_id === jobId)) {
    this.linkedJobs.push({
      job_id: jobId,
      linkedAt: new Date()
    });
  }
  
  return this.save();
};

// Static method to get user's default resume
resumeSchema.statics.getUserDefault = async function(userId) {
  return this.findOne({ user_id: userId, isDefault: true, isArchived: false });
};

// Pre-save hook to ensure only one default resume per user
resumeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { user_id: this.user_id, resume_id: { $ne: this.resume_id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export default mongoose.model("Resume", resumeSchema);
