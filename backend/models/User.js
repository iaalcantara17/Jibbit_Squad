import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ============================
// Sub-Schemas
// ============================

// Basic Info
const basicInfoSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  phoneNumber: String,
  location: String,
  professionalHeadline: { type: String, maxlength: 120 },
  bio: { type: String, maxlength: 1000 },
  industry: String,
  experienceLevel: {
    type: String,
    enum: ["Entry Level", "Mid Level", "Senior", "Executive"]
  }
}, { _id: false });

// Employment History
const employmentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  jobTitle: String,
  company: String,
  location: String,
  startDate: String, // YYYY-MM
  endDate: String,   // YYYY-MM
  currentlyWorking: Boolean,
  description: { type: String, maxlength: 1000 }
}, { _id: false });

// Skills
const skillSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  proficiency: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"]
  },
  category: {
    type: String,
    enum: ["Technical", "Soft Skills", "Languages", "Industry-Specific"]
  }
}, { _id: false });

// Education
const educationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  institution: String,
  degree: String,
  fieldOfStudy: String,
  graduationDate: String, // YYYY-MM
  currentlyEnrolled: Boolean,
  gpa: String,
  showGpa: Boolean,
  educationLevel: {
    type: String,
    enum: [
      "High School", "Associate", "Bachelor",
      "Master", "Doctorate", "Certificate",
      "Bootcamp", "Other"
    ]
  },
  achievements: String
}, { _id: false });

// Certifications
const certificationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  issuingOrganization: String,
  dateEarned: String, // YYYY-MM
  expirationDate: String, // YYYY-MM
  doesNotExpire: Boolean,
  certificationNumber: String,
  documentUrl: String
}, { _id: false });

// Special Projects
const projectSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: String,
  description: { type: String, maxlength: 500 },
  role: String,
  technologies: String, // comma-separated
  startDate: String, // YYYY-MM
  endDate: String,   // YYYY-MM
  ongoing: Boolean,
  projectUrl: String,
  repositoryUrl: String
}, { _id: false });

// ============================
// Main User Schema
// ============================

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: uuidv4,
    unique: true
  },
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function () {
      return this.provider === "local";
    }
  },

  // OAuth provider info
  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  providerId: { type: String },

  // Extended Profile Sections
  basicInfo: [basicInfoSchema],
  employmentHistory: [employmentSchema],
  skills: [skillSchema],
  education: [educationSchema],
  certifications: [certificationSchema],
  projects: [projectSchema],

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date

}, { timestamps: true }); // auto adds createdAt & updatedAt

export default mongoose.model("User", userSchema);

