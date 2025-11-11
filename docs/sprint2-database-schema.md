# Sprint 2 Complete Database Schema
*CS 490 Capstone Project - MongoDB Schema Design*

## Overview
This document defines the complete MongoDB schema for Sprint 2, covering all 40 use cases (UC-036 through UC-073) with full feature support.

---

## Collections

### 1. Jobs Collection
**Purpose**: Store all job opportunities with full tracking capabilities

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  
  // Basic Information (UC-036)
  title: String, // required
  company: String, // required
  location: String,
  salaryRange: {
    min: Number,
    max: Number,
    currency: String, // default: "USD"
  },
  
  // Job Details (UC-036, UC-038)
  jobPostingUrl: String,
  applicationDeadline: Date,
  jobDescription: String, // max 2000 chars
  industry: String, // dropdown value
  jobType: String, // dropdown value: Full-time, Part-time, Contract, etc.
  
  // Status Pipeline (UC-037)
  status: String, // required: Interested, Applied, Phone Screen, Interview, Offer, Rejected
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String, // optional
  }],
  daysInCurrentStage: Number, // calculated field
  
  // Notes and Details (UC-038)
  notes: String, // unlimited text for personal observations
  contacts: [{
    name: String,
    role: String, // Recruiter, Hiring Manager, etc.
    email: String,
    phone: String,
    notes: String,
  }],
  applicationHistory: [{
    action: String, // Applied, Follow-up, Interview Scheduled, etc.
    timestamp: Date,
    details: String,
  }],
  salaryNegotiationNotes: String,
  interviewNotes: [{
    interviewDate: Date,
    interviewType: String, // Phone, Video, In-person, Technical, etc.
    interviewer: String,
    feedback: String,
    outcome: String,
  }],
  
  // URL Import (UC-041)
  importMetadata: {
    importDate: Date,
    source: String, // LinkedIn, Indeed, Glassdoor, Manual
    importStatus: String, // success, partial, failed
    autoPopulatedFields: [String], // list of fields auto-filled
  },
  
  // Application Materials Tracking (UC-042)
  applicationMaterials: {
    resumeId: ObjectId, // ref: Resumes
    resumeVersion: String,
    coverLetterId: ObjectId, // ref: CoverLetters
    coverLetterVersion: String,
    attachedDate: Date,
  },
  materialsHistory: [{
    resumeId: ObjectId,
    coverLetterId: ObjectId,
    attachedDate: Date,
    updatedDate: Date,
  }],
  
  // Company Reference (UC-043)
  companyId: ObjectId, // ref: CompanyResearch
  
  // Deadline Tracking (UC-040)
  deadlineStatus: String, // calculated: upcoming, urgent, overdue
  deadlineReminders: [{
    reminderDate: Date,
    sent: Boolean,
    type: String, // email, notification
  }],
  deadlineExtended: Boolean,
  originalDeadline: Date, // if deadline was extended
  
  // Archiving (UC-045)
  archived: Boolean, // default: false
  archiveReason: String,
  archivedDate: Date,
  autoArchiveDate: Date, // scheduled auto-archive
  
  // Search and Filtering (UC-039)
  tags: [String], // custom user tags
  searchKeywords: [String], // extracted for search optimization
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastViewedAt: Date,
}

// Indexes
db.jobs.createIndex({ userId: 1, status: 1 })
db.jobs.createIndex({ userId: 1, applicationDeadline: 1 })
db.jobs.createIndex({ userId: 1, archived: 1 })
db.jobs.createIndex({ userId: 1, company: 1 })
db.jobs.createIndex({ userId: 1, createdAt: -1 })
db.jobs.createIndex({ userId: 1, searchKeywords: 1 })
```

---

### 2. Resumes Collection
**Purpose**: Store resume versions with AI generation and collaboration features

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  
  // Basic Information (UC-046, UC-052)
  name: String, // required - version name
  description: String,
  version: String, // v1.0, v2.0, etc.
  isDefault: Boolean, // default: false
  
  // Template Information (UC-046)
  templateType: String, // chronological, functional, hybrid
  templateStyle: {
    colors: {
      primary: String,
      secondary: String,
      text: String,
    },
    fonts: {
      heading: String,
      body: String,
    },
    layout: String, // single-column, two-column, etc.
  },
  
  // Resume Sections (UC-048)
  sections: [{
    type: String, // contact, summary, experience, education, skills, projects, certifications
    enabled: Boolean,
    order: Number,
    content: Object, // section-specific structure
    completionStatus: String, // complete, incomplete, needs-review
    formatting: {
      style: String,
      spacing: String,
    },
  }],
  sectionPresets: [String], // saved section arrangements
  
  // Contact Information
  contactInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    website: String,
    portfolio: String,
  },
  
  // Summary/Objective
  summary: String,
  
  // Work Experience (UC-047, UC-050)
  experience: [{
    employmentId: ObjectId, // ref: EmploymentHistory from profile
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    bullets: [String],
    aiGenerated: Boolean,
    relevanceScore: Number, // 0-100 (UC-050)
    tailoredForJobId: ObjectId, // ref: Jobs
    variations: [{
      content: [String],
      generatedDate: Date,
      usedForJobId: ObjectId,
    }],
  }],
  
  // Skills Section (UC-049)
  skills: {
    technical: [{
      skillId: ObjectId, // ref: Skills from profile
      name: String,
      displayOrder: Number,
      relevanceScore: Number, // 0-100
      emphasized: Boolean,
    }],
    soft: [{
      name: String,
      displayOrder: Number,
      relevanceScore: Number,
    }],
    aiOptimized: Boolean,
    optimizedForJobId: ObjectId, // ref: Jobs
    matchingScore: Number, // skills matching percentage
  },
  
  // Education
  education: [{
    educationId: ObjectId, // ref: Education from profile
    institution: String,
    degree: String,
    field: String,
    graduationDate: Date,
    gpa: Number,
    honors: [String],
  }],
  
  // Projects
  projects: [{
    projectId: ObjectId, // ref: SpecialProjects from profile
    name: String,
    description: String,
    technologies: [String],
    url: String,
  }],
  
  // Certifications
  certifications: [{
    certificationId: ObjectId, // ref: Certifications from profile
    name: String,
    issuer: String,
    dateObtained: Date,
    expirationDate: Date,
  }],
  
  // AI Generation Metadata (UC-047)
  aiMetadata: {
    generatedForJobId: ObjectId, // ref: Jobs
    generationDate: Date,
    model: String, // AI model used
    prompt: String,
    atsOptimized: Boolean,
    keywords: [String], // ATS keywords included
    contentVariations: Number,
  },
  
  // Validation (UC-053)
  validation: {
    lastCheckedDate: Date,
    spellCheckPassed: Boolean,
    grammarCheckPassed: Boolean,
    formatConsistent: Boolean,
    lengthOptimal: Boolean, // 1-2 pages
    missingInfoWarnings: [String],
    contactInfoValid: Boolean,
    professionalTone: Boolean,
    readabilityScore: Number, // 0-100
    issues: [{
      type: String, // spelling, grammar, format, length, etc.
      severity: String, // error, warning, info
      message: String,
      location: String,
    }],
  },
  
  // Version Management (UC-052)
  parentResumeId: ObjectId, // ref: Resumes (for version tracking)
  versionHistory: [{
    versionNumber: String,
    createdDate: Date,
    changes: String,
    createdFromJobId: ObjectId,
  }],
  linkedJobApplications: [ObjectId], // ref: Jobs
  
  // Export Settings (UC-051)
  exportSettings: {
    defaultFormat: String, // PDF, DOCX, TXT, HTML
    theme: String,
    watermark: String,
    branding: {
      enabled: Boolean,
      logoUrl: String,
      text: String,
    },
    customFilename: String,
  },
  
  // Collaboration (UC-054) - references ResumeCollaboration collection
  shareableLink: String, // unique shareable URL
  privacySettings: {
    isPublic: Boolean,
    allowComments: Boolean,
    expirationDate: Date,
  },
  
  // Usage Analytics (UC-042)
  usageStats: {
    timesUsed: Number,
    lastUsedDate: Date,
    successfulApplications: Number,
    responseRate: Number, // percentage
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastEditedAt: Date,
  archivedDate: Date,
}

// Indexes
db.resumes.createIndex({ userId: 1, isDefault: 1 })
db.resumes.createIndex({ userId: 1, createdAt: -1 })
db.resumes.createIndex({ userId: 1, name: 1 })
db.resumes.createIndex({ shareableLink: 1 }, { unique: true, sparse: true })
db.resumes.createIndex({ "aiMetadata.generatedForJobId": 1 })
```

---

### 3. ResumeCollaboration Collection
**Purpose**: Handle resume sharing, feedback, and collaboration (UC-054)

```javascript
{
  _id: ObjectId,
  resumeId: ObjectId, // ref: Resumes
  ownerId: ObjectId, // ref: Users
  
  // Shareable Link
  shareToken: String, // unique token for URL
  shareUrl: String, // full shareable URL
  
  // Access Control
  accessType: String, // view-only, comment, suggest-edits
  expirationDate: Date,
  passwordProtected: Boolean,
  password: String, // hashed if protected
  
  // Collaborators
  collaborators: [{
    userId: ObjectId, // ref: Users (if registered user)
    email: String, // if guest reviewer
    name: String,
    role: String, // mentor, career-coach, peer, reviewer
    permissions: [String], // view, comment, suggest
    invitedDate: Date,
    lastAccessDate: Date,
    status: String, // pending, active, revoked
  }],
  
  // Comments and Feedback
  comments: [{
    commentId: ObjectId,
    userId: ObjectId, // commenter
    userName: String,
    section: String, // which resume section
    content: String,
    timestamp: Date,
    resolved: Boolean,
    replies: [{
      userId: ObjectId,
      content: String,
      timestamp: Date,
    }],
  }],
  
  // Version Tracking with Feedback
  feedbackVersions: [{
    versionId: ObjectId,
    feedbackIncorporated: [ObjectId], // ref: comment IDs
    changesSummary: String,
    createdDate: Date,
  }],
  
  // Notifications
  notifications: [{
    userId: ObjectId,
    type: String, // new-comment, feedback-received, version-updated
    message: String,
    read: Boolean,
    timestamp: Date,
  }],
  
  // Feedback Summary (UC-054)
  feedbackSummary: {
    totalComments: Number,
    resolvedComments: Number,
    averageRating: Number,
    keyThemes: [String], // AI-extracted common feedback themes
    exportedDate: Date,
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date,
}

// Indexes
db.resumeCollaboration.createIndex({ resumeId: 1 })
db.resumeCollaboration.createIndex({ shareToken: 1 }, { unique: true })
db.resumeCollaboration.createIndex({ ownerId: 1 })
db.resumeCollaboration.createIndex({ "collaborators.userId": 1 })
```

---

### 4. CoverLetters Collection
**Purpose**: Store cover letter versions with AI generation and performance tracking

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  
  // Basic Information (UC-055, UC-061)
  name: String, // required - version name
  description: String,
  jobId: ObjectId, // ref: Jobs - which job this is for
  
  // Template Information (UC-055)
  templateType: String, // formal, creative, technical, etc.
  templateStyle: {
    layout: String,
    formatting: Object,
  },
  industrySpecific: String,
  
  // Content (UC-056)
  content: {
    greeting: String,
    openingParagraph: String, // personalized with company/role
    bodyParagraphs: [String], // highlighting relevant experience
    closingParagraph: String, // call-to-action
    signature: String,
  },
  
  // AI Generation Metadata (UC-056)
  aiMetadata: {
    generatedForJobId: ObjectId,
    generationDate: Date,
    model: String,
    prompt: String,
    variationsGenerated: Number,
    selectedVariation: Number,
  },
  
  // Company Research Integration (UC-057)
  companyResearch: {
    companyId: ObjectId, // ref: CompanyResearch
    includedElements: [String], // which research elements were used
    recentNews: [String], // news references included
    missionAlignment: String,
    initiatives: [String],
  },
  
  // Tone and Style (UC-058)
  styleSettings: {
    tone: String, // formal, casual, enthusiastic, analytical
    industryLanguage: Boolean,
    companyCulture: String, // startup, corporate, nonprofit, etc.
    length: String, // brief, standard, detailed
    writingStyle: String, // direct, narrative, bullet-points
    customInstructions: String,
  },
  toneConsistency: {
    validated: Boolean,
    score: Number, // 0-100
    suggestions: [String],
  },
  
  // Experience Highlighting (UC-059)
  highlightedExperiences: [{
    experienceId: ObjectId, // ref: EmploymentHistory
    narrative: String,
    quantifiedAchievements: [String],
    relevanceScore: Number, // 0-100
    connectionToJob: String,
  }],
  alternativePresentations: [{
    experienceId: ObjectId,
    variation: String,
    score: Number,
  }],
  
  // Editing and Refinement (UC-060)
  editingHistory: [{
    timestamp: Date,
    changes: String,
    version: String,
  }],
  validation: {
    spellCheckPassed: Boolean,
    grammarCheckPassed: Boolean,
    wordCount: Number,
    characterCount: Number,
    readabilityScore: Number, // 0-100
    suggestions: [{
      type: String, // synonym, restructure, etc.
      original: String,
      suggested: String,
    }],
  },
  autoSaveEnabled: Boolean,
  lastAutoSave: Date,
  
  // Export Settings (UC-061)
  exportSettings: {
    defaultFormat: String, // PDF, DOCX, TXT
    letterhead: {
      enabled: Boolean,
      logoUrl: String,
      address: String,
    },
    formattingStyle: String,
    customFilename: String,
  },
  
  // Performance Tracking (UC-062) - references CoverLetterPerformance
  performanceId: ObjectId, // ref: CoverLetterPerformance
  
  // Version Management
  version: String,
  parentCoverLetterId: ObjectId, // ref: CoverLetters
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastEditedAt: Date,
  usedForApplicationDate: Date,
}

// Indexes
db.coverLetters.createIndex({ userId: 1, jobId: 1 })
db.coverLetters.createIndex({ userId: 1, createdAt: -1 })
db.coverLetters.createIndex({ userId: 1, templateType: 1 })
db.coverLetters.createIndex({ "aiMetadata.generatedForJobId": 1 })
```

---

### 5. CoverLetterPerformance Collection
**Purpose**: Track cover letter effectiveness and A/B testing (UC-062)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  coverLetterId: ObjectId, // ref: CoverLetters
  
  // Application Outcome Tracking
  linkedApplications: [{
    jobId: ObjectId, // ref: Jobs
    applicationDate: Date,
    outcome: String, // no-response, rejected, phone-screen, interview, offer
    responseDate: Date,
    responseTime: Number, // days from application to response
  }],
  
  // Performance Metrics
  metrics: {
    totalApplications: Number,
    responseRate: Number, // percentage
    interviewRate: Number, // percentage
    offerRate: Number, // percentage
    averageResponseTime: Number, // days
  },
  
  // Template/Style Analysis
  templateEffectiveness: {
    templateType: String,
    styleSettings: Object,
    successScore: Number, // 0-100
    comparisonGroup: [ObjectId], // other cover letters to compare
  },
  
  // A/B Testing (UC-062)
  abTests: [{
    testId: ObjectId,
    testName: String,
    variant: String, // A, B, C, etc.
    startDate: Date,
    endDate: Date,
    controlGroup: [ObjectId], // ref: CoverLetters
    results: {
      responseRate: Number,
      winnerDeclared: Boolean,
      significanceLevel: Number,
    },
  }],
  
  // Pattern Identification
  successPatterns: [{
    pattern: String, // opening-style, length, tone, etc.
    description: String,
    frequency: Number,
    successRate: Number,
  }],
  
  // Improvement Recommendations
  recommendations: [{
    type: String,
    description: String,
    expectedImpact: String, // low, medium, high
    basedOn: String, // data source
    generatedDate: Date,
  }],
  
  // Industry/Role Breakdown
  performanceByIndustry: [{
    industry: String,
    applications: Number,
    successRate: Number,
  }],
  performanceByRole: [{
    roleType: String,
    applications: Number,
    successRate: Number,
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastAnalyzedAt: Date,
}

// Indexes
db.coverLetterPerformance.createIndex({ userId: 1, coverLetterId: 1 })
db.coverLetterPerformance.createIndex({ userId: 1, "metrics.responseRate": -1 })
```

---

### 6. CompanyResearch Collection
**Purpose**: Store automated company research data (UC-063, UC-064)

```javascript
{
  _id: ObjectId,
  companyName: String, // required, unique per user
  userId: ObjectId, // ref: Users
  
  // Basic Information (UC-063)
  basicInfo: {
    legalName: String,
    industry: String,
    size: String, // 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
    headquarters: {
      city: String,
      state: String,
      country: String,
    },
    founded: Number, // year
    website: String,
    logoUrl: String,
  },
  
  // Company Profile (UC-063)
  profile: {
    mission: String,
    values: [String],
    culture: String,
    description: String,
    productsServices: [String],
    targetMarket: String,
  },
  
  // Leadership (UC-063)
  leadership: [{
    name: String,
    title: String,
    bio: String,
    linkedinUrl: String,
    photoUrl: String,
  }],
  
  // News and Updates (UC-064)
  news: [{
    title: String,
    url: String,
    source: String,
    publishDate: Date,
    category: String, // funding, product-launch, hiring, acquisition, etc.
    summary: String,
    keyPoints: [String],
    relevanceScore: Number, // 0-100
    sentiment: String, // positive, neutral, negative
  }],
  
  // Social Media (UC-063)
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    glassdoor: String,
  },
  
  // Ratings (UC-043)
  ratings: {
    glassdoor: {
      overallRating: Number,
      ceoApproval: Number,
      recommendToFriend: Number,
      totalReviews: Number,
      url: String,
    },
    indeed: {
      rating: Number,
      totalReviews: Number,
    },
  },
  
  // Financial Information
  financial: {
    revenue: String,
    funding: {
      totalRaised: Number,
      lastRound: {
        type: String, // Seed, Series A, B, C, etc.
        amount: Number,
        date: Date,
        investors: [String],
      },
    },
    publiclyTraded: Boolean,
    stockSymbol: String,
  },
  
  // Competitive Landscape (UC-063)
  competitive: {
    mainCompetitors: [String],
    marketPosition: String,
    differentiators: [String],
  },
  
  // Research Summary (UC-063)
  summary: {
    generatedDate: Date,
    summaryText: String,
    keyTakeaways: [String],
    strengthsOpportunities: [String],
  },
  
  // News Alerts (UC-064)
  alerts: [{
    userId: ObjectId,
    alertType: String, // email, notification
    frequency: String, // immediate, daily, weekly
    keywords: [String],
    lastSent: Date,
  }],
  
  // Contact Information (UC-043)
  contactInfo: {
    generalEmail: String,
    phone: String,
    recruitmentEmail: String,
    pressEmail: String,
  },
  
  // Data Freshness
  lastResearchDate: Date,
  nextUpdateDate: Date,
  researchStatus: String, // complete, partial, pending, failed
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.companyResearch.createIndex({ userId: 1, companyName: 1 }, { unique: true })
db.companyResearch.createIndex({ userId: 1, lastResearchDate: -1 })
db.companyResearch.createIndex({ "news.publishDate": -1 })
```

---

### 7. JobMatchScores Collection
**Purpose**: Store job matching analysis and skills gap data (UC-065, UC-066)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  jobId: ObjectId, // ref: Jobs
  
  // Overall Match Score (UC-065)
  overallScore: Number, // 0-100
  calculatedDate: Date,
  
  // Category Breakdown (UC-065)
  categoryScores: {
    skills: {
      score: Number, // 0-100
      weight: Number, // personalized weighting
      details: String,
    },
    experience: {
      score: Number,
      weight: Number,
      details: String,
    },
    education: {
      score: Number,
      weight: Number,
      details: String,
    },
    certifications: {
      score: Number,
      weight: Number,
      details: String,
    },
    location: {
      score: Number,
      weight: Number,
      details: String,
    },
  },
  
  // Strengths and Gaps (UC-065)
  strengths: [{
    category: String,
    description: String,
    impact: String, // high, medium, low
  }],
  gaps: [{
    category: String,
    description: String,
    severity: String, // critical, important, minor
    improvementSuggestion: String,
  }],
  
  // Skills Gap Analysis (UC-066)
  skillsGap: {
    requiredSkills: [{
      skillName: String,
      importance: String, // required, preferred, nice-to-have
      userHasSkill: Boolean,
      userProficiency: Number, // 0-100 if user has it
      gap: String, // missing, weak, adequate, strong
    }],
    missingSkills: [{
      skillName: String,
      importance: String,
      priority: Number, // 1-5
      impactOnMatch: Number, // how much this affects match score
    }],
    weakSkills: [{
      skillName: String,
      currentLevel: Number,
      targetLevel: Number,
      improvementNeeded: String,
    }],
  },
  
  // Learning Recommendations (UC-066) - references LearningResources
  learningPathId: ObjectId, // ref: LearningResources
  
  // Profile Improvement Suggestions (UC-065)
  improvementSuggestions: [{
    type: String, // add-skill, get-certification, highlight-experience, etc.
    description: String,
    expectedScoreIncrease: Number, // points
    priority: String, // high, medium, low
    effort: String, // low, medium, high
  }],
  
  // Comparison with Other Jobs (UC-065)
  comparisons: [{
    otherJobId: ObjectId,
    otherJobTitle: String,
    otherJobScore: Number,
    differenceAnalysis: String,
  }],
  
  // Score History (UC-065)
  scoreHistory: [{
    score: Number,
    date: Date,
    changedBecause: String, // profile-updated, job-updated, algorithm-updated
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.jobMatchScores.createIndex({ userId: 1, jobId: 1 }, { unique: true })
db.jobMatchScores.createIndex({ userId: 1, overallScore: -1 })
db.jobMatchScores.createIndex({ userId: 1, calculatedDate: -1 })
```

---

### 8. LearningResources Collection
**Purpose**: Track skill development and learning recommendations (UC-066)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  jobMatchScoreId: ObjectId, // ref: JobMatchScores (what triggered this)
  
  // Learning Path
  pathName: String, // e.g., "Learn React for Frontend Developer Role"
  pathDescription: String,
  targetJobId: ObjectId, // ref: Jobs
  
  // Skill Development Tracking
  skillsToLearn: [{
    skillName: String,
    currentProficiency: Number, // 0-100
    targetProficiency: Number, // 0-100
    priority: Number, // 1-5
    importance: String, // critical, important, beneficial
    estimatedTimeToLearn: String, // e.g., "2-3 months"
    status: String, // not-started, in-progress, completed
    startedDate: Date,
    completedDate: Date,
    progress: Number, // 0-100
  }],
  
  // Learning Resources (UC-066)
  resources: [{
    skillName: String,
    resourceType: String, // course, tutorial, book, certification, bootcamp, practice
    title: String,
    provider: String, // Coursera, Udemy, LinkedIn Learning, etc.
    url: String,
    duration: String,
    cost: Number,
    costCurrency: String,
    difficulty: String, // beginner, intermediate, advanced
    rating: Number,
    reviewCount: Number,
    recommended: Boolean,
    completionStatus: String, // not-started, in-progress, completed
    completionDate: Date,
    notes: String,
  }],
  
  // Integration with Learning Platforms (UC-066)
  platformIntegrations: [{
    platform: String, // Coursera, Udemy, LinkedIn Learning, etc.
    apiKey: String, // encrypted
    syncEnabled: Boolean,
    lastSyncDate: Date,
    enrolledCourses: [{
      courseId: String,
      courseName: String,
      progress: Number,
      estimatedCompletion: Date,
    }],
  }],
  
  // Progress Tracking (UC-066)
  overallProgress: {
    totalSkills: Number,
    completedSkills: Number,
    inProgressSkills: Number,
    percentageComplete: Number,
    estimatedCompletionDate: Date,
  },
  
  // Skill Gap Trends (UC-066)
  trends: [{
    date: Date,
    totalGaps: Number,
    criticalGaps: Number,
    skillsLearned: Number,
    averageProficiencyGain: Number,
  }],
  
  // Milestones and Achievements
  milestones: [{
    title: String,
    description: String,
    achievedDate: Date,
    skillsInvolved: [String],
  }],
  
  // Recommendations
  recommendations: [{
    type: String, // next-course, practice-project, certification, networking
    description: String,
    relevance: String, // high, medium, low
    generatedDate: Date,
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastUpdatedProgress: Date,
}

// Indexes
db.learningResources.createIndex({ userId: 1, targetJobId: 1 })
db.learningResources.createIndex({ userId: 1, "overallProgress.percentageComplete": -1 })
db.learningResources.createIndex({ userId: 1, createdAt: -1 })
```

---

### 9. InterviewPreparation Collection
**Purpose**: Store interview insights and preparation checklists (UC-068, UC-071)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  jobId: ObjectId, // ref: Jobs
  companyId: ObjectId, // ref: CompanyResearch
  
  // Interview Process Research (UC-068)
  interviewProcess: {
    typicalStages: [{
      stageName: String, // Phone Screen, Technical, Behavioral, etc.
      order: Number,
      duration: String,
      description: String,
      format: String, // phone, video, in-person, coding challenge
    }],
    timelineExpectation: {
      averageDuration: String, // e.g., "2-4 weeks"
      stagesCount: Number,
      decisionTimeline: String,
    },
    researchSource: String, // Glassdoor, Blind, company careers page
    lastUpdated: Date,
  },
  
  // Common Interview Questions (UC-068)
  commonQuestions: [{
    question: String,
    category: String, // behavioral, technical, situational, role-specific
    frequency: String, // very-common, common, occasional
    difficulty: String, // easy, medium, hard
    suggestedAnswer: String,
    preparedAnswer: String, // user's prepared answer
    source: String,
  }],
  
  // Interviewer Information (UC-068)
  interviewers: [{
    name: String,
    title: String,
    department: String,
    linkedinUrl: String,
    background: String,
    interviewStyle: String,
    notes: String,
  }],
  
  // Company-Specific Interview Format (UC-068)
  interviewFormat: {
    codeReviewRequired: Boolean,
    liveCodingRequired: Boolean,
    takeHomeAssignment: Boolean,
    presentationRequired: Boolean,
    panelInterview: Boolean,
    caseStudyRequired: Boolean,
    formatNotes: String,
  },
  
  // Preparation Recommendations (UC-068)
  preparationRecommendations: [{
    area: String, // technical-skills, behavioral-questions, company-research, etc.
    recommendation: String,
    priority: String, // high, medium, low
    estimatedTimeNeeded: String,
    completed: Boolean,
    completedDate: Date,
  }],
  
  // Success Tips (UC-068)
  successTips: [{
    tip: String,
    category: String,
    source: String, // Glassdoor, past candidates, etc.
    upvotes: Number,
  }],
  
  // Interview Preparation Checklist (UC-068, UC-071)
  checklist: [{
    taskId: ObjectId,
    task: String,
    category: String, // research, practice, logistics, follow-up
    dueDate: Date,
    completed: Boolean,
    completedDate: Date,
    priority: String, // high, medium, low
    autoGenerated: Boolean,
    relatedTo: String, // specific interview stage
  }],
  
  // Scheduled Interviews (UC-071)
  scheduledInterviews: [{
    interviewDate: Date,
    interviewTime: String,
    timezone: String,
    interviewType: String, // phone, video, in-person, technical
    interviewStage: String,
    location: String, // physical address or video link
    interviewer: String,
    duration: Number, // minutes
    
    // Logistics
    travelTime: Number, // minutes if in-person
    preparationTime: Number, // minutes before interview
    remindersSent: [{
      reminderType: String, // 1-day, 1-hour, etc.
      sentDate: Date,
    }],
    
    // Calendar Integration
    calendarEventId: String, // external calendar system ID
    calendarProvider: String, // Google, Outlook, Apple
    
    // Reschedule/Cancel
    rescheduled: Boolean,
    originalDate: Date,
    rescheduleReason: String,
    cancelled: Boolean,
    cancellationReason: String,
    
    // Outcome
    completed: Boolean,
    outcome: String, // advanced, rejected, pending
    outcomeDate: Date,
    feedback: String,
    nextSteps: String,
  }],
  
  // Calendar Conflict Detection (UC-071)
  conflicts: [{
    interviewId: ObjectId,
    conflictingEventId: String,
    conflictingEventTitle: String,
    conflictDate: Date,
    resolved: Boolean,
    resolution: String,
  }],
  
  // Preparation Tasks Auto-Generation (UC-071)
  autoGeneratedTasks: [{
    taskType: String, // research-company, review-resume, prepare-questions, etc.
    task: String,
    relatedInterviewId: ObjectId,
    dueDate: Date,
    completed: Boolean,
  }],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastPreparedAt: Date,
}

// Indexes
db.interviewPreparation.createIndex({ userId: 1, jobId: 1 }, { unique: true })
db.interviewPreparation.createIndex({ userId: 1, "scheduledInterviews.interviewDate": 1 })
db.interviewPreparation.createIndex({ userId: 1, "checklist.completed": 1 })
```

---

### 10. ApplicationMaterials Collection
**Purpose**: Track which resume/cover letter versions used per application (UC-042)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  jobId: ObjectId, // ref: Jobs
  applicationDate: Date,
  
  // Materials Used
  materials: {
    resume: {
      resumeId: ObjectId, // ref: Resumes
      version: String,
      fileName: String,
      fileUrl: String, // where it's stored
      uploadedDate: Date,
    },
    coverLetter: {
      coverLetterId: ObjectId, // ref: CoverLetters
      version: String,
      fileName: String,
      fileUrl: String,
      uploadedDate: Date,
    },
    portfolio: {
      portfolioUrl: String,
      portfolioVersion: String,
    },
    otherDocuments: [{
      documentType: String,
      fileName: String,
      fileUrl: String,
      uploadedDate: Date,
    }],
  },
  
  // Version History (UC-042)
  updateHistory: [{
    updateDate: Date,
    updatedField: String, // resume, cover-letter, portfolio
    oldVersion: String,
    newVersion: String,
    reason: String,
  }],
  
  // Version Comparison (UC-042)
  comparisons: [{
    comparisonDate: Date,
    documentType: String, // resume, cover-letter
    version1Id: ObjectId,
    version2Id: ObjectId,
    differences: [{
      section: String,
      changeType: String, // added, removed, modified
      description: String,
    }],
  }],
  
  // Download/View Tracking
  accessLog: [{
    action: String, // downloaded, viewed, shared
    timestamp: Date,
    documentType: String,
  }],
  
  // Materials Analytics (UC-042)
  analytics: {
    materialsCreatedForJob: Boolean,
    tailoredToJob: Boolean,
    atsOptimized: Boolean,
    keywordsMatched: Number,
    timeSpentCreating: Number, // minutes
  },
  
  // Default Materials Tracking (UC-042)
  usedDefaultMaterials: Boolean,
  customizedForApplication: Boolean,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.applicationMaterials.createIndex({ userId: 1, jobId: 1 }, { unique: true })
db.applicationMaterials.createIndex({ userId: 1, applicationDate: -1 })
db.applicationMaterials.createIndex({ "materials.resume.resumeId": 1 })
db.applicationMaterials.createIndex({ "materials.coverLetter.coverLetterId": 1 })
```

---

### 11. UserPreferences Collection
**Purpose**: Store user preferences and settings (UC-039, UC-045, UC-046, UC-065, UC-072)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users, unique
  
  // Search Preferences (UC-039)
  savedSearches: [{
    searchName: String,
    filters: {
      status: [String],
      industry: [String],
      location: [String],
      salaryRange: {
        min: Number,
        max: Number,
      },
      dateRange: {
        start: Date,
        end: Date,
      },
      keywords: [String],
    },
    sortBy: String,
    isDefault: Boolean,
    lastUsed: Date,
  }],
  
  // Default Resume Template (UC-046)
  defaultResumeTemplateId: ObjectId, // ref: Resumes
  
  // Auto-Archive Settings (UC-045)
  autoArchive: {
    enabled: Boolean,
    archiveAfterDays: Number, // days since status change
    archiveStatuses: [String], // which statuses trigger auto-archive
    notifyBeforeArchive: Boolean,
    notifyDaysBefore: Number,
  },
  
  // Match Score Weighting (UC-065)
  matchScoreWeights: {
    skills: Number, // 0-100, percentage weight
    experience: Number,
    education: Number,
    certifications: Number,
    location: Number,
    customWeights: [{
      factor: String,
      weight: Number,
    }],
  },
  
  // Notification Preferences (UC-040, UC-064, UC-070)
  notifications: {
    deadlineReminders: {
      enabled: Boolean,
      reminderDaysBefore: [Number], // e.g., [7, 3, 1]
      deliveryMethod: [String], // email, push, in-app
    },
    statusChanges: {
      enabled: Boolean,
      notifyOn: [String], // which status changes to notify
      deliveryMethod: [String],
    },
    companyNews: {
      enabled: Boolean,
      frequency: String, // immediate, daily, weekly
      deliveryMethod: [String],
    },
    applicationUpdates: {
      enabled: Boolean,
      autoDetection: Boolean,
      deliveryMethod: [String],
    },
  },
  
  // Goal Settings (UC-072)
  goals: [{
    goalType: String, // applications-per-week, interviews-per-month, etc.
    targetValue: Number,
    currentValue: Number,
    startDate: Date,
    endDate: Date,
    status: String, // on-track, behind, achieved
  }],
  
  // Dashboard Preferences
  dashboardWidgets: [{
    widgetType: String, // upcoming-deadlines, recent-applications, match-scores, etc.
    position: Number,
    visible: Boolean,
    settings: Object, // widget-specific settings
  }],
  
  // Export Preferences
  exportDefaults: {
    resumeFormat: String, // PDF, DOCX, etc.
    coverLetterFormat: String,
    includeWatermark: Boolean,
    fileNamingPattern: String,
  },
  
  // Privacy Settings
  privacy: {
    allowResumeFeedback: Boolean,
    allowDataSharing: Boolean,
    allowAnalytics: Boolean,
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.userPreferences.createIndex({ userId: 1 }, { unique: true })
```

---

### 12. Analytics Collection
**Purpose**: Store aggregated analytics data (UC-044, UC-072)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  
  // Job Statistics (UC-044)
  jobStats: {
    totalJobs: Number,
    byStatus: {
      interested: Number,
      applied: Number,
      phoneScreen: Number,
      interview: Number,
      offer: Number,
      rejected: Number,
    },
    applicationResponseRate: Number, // percentage
    averageTimeInStage: {
      interested: Number, // days
      applied: Number,
      phoneScreen: Number,
      interview: Number,
    },
    monthlyApplicationVolume: [{
      month: String, // YYYY-MM
      count: Number,
    }],
    deadlineAdherence: {
      onTime: Number,
      late: Number,
      adherenceRate: Number, // percentage
    },
    timeToOffer: {
      averageDays: Number,
      fastestDays: Number,
      slowestDays: Number,
    },
  },
  
  // Application Pipeline Analytics (UC-072)
  pipelineAnalytics: {
    funnelData: {
      applied: Number,
      phoneScreen: Number,
      interview: Number,
      offer: Number,
      conversionRates: {
        appliedToScreen: Number, // percentage
        screenToInterview: Number,
        interviewToOffer: Number,
      },
    },
    timeToResponse: [{
      companyName: String,
      industry: String,
      averageDays: Number,
    }],
    successRateByApproach: [{
      approach: String, // referral, cold-apply, recruiter, etc.
      applications: Number,
      successRate: Number,
    }],
    volumeTrends: [{
      week: String, // YYYY-WW
      applications: Number,
      interviews: Number,
      offers: Number,
    }],
  },
  
  // Benchmarking (UC-072)
  benchmarking: {
    industryAverages: {
      responseRate: Number,
      interviewRate: Number,
      offerRate: Number,
      timeToOffer: Number,
    },
    userVsIndustry: {
      responseRateDiff: Number, // percentage points difference
      interviewRateDiff: Number,
      offerRateDiff: Number,
    },
  },
  
  // Optimization Recommendations (UC-072)
  recommendations: [{
    type: String,
    recommendation: String,
    basedOn: String, // which data led to this recommendation
    expectedImpact: String, // high, medium, low
    priority: Number,
    generatedDate: Date,
  }],
  
  // Export History
  exports: [{
    exportDate: Date,
    exportType: String, // job-stats, pipeline-analytics, full-report
    format: String, // CSV, PDF, JSON
    fileName: String,
  }],
  
  // Calculation Metadata
  lastCalculated: Date,
  calculationFrequency: String, // daily, weekly, real-time
  dataRange: {
    startDate: Date,
    endDate: Date,
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.analytics.createIndex({ userId: 1 }, { unique: true })
db.analytics.createIndex({ userId: 1, lastCalculated: -1 })
```

---

### 13. CalendarIntegration Collection
**Purpose**: Manage calendar provider integrations (UC-071)

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: Users
  
  // Provider Information
  provider: String, // Google, Outlook, Apple, etc.
  providerAccountId: String,
  providerEmail: String,
  
  // Authentication
  accessToken: String, // encrypted
  refreshToken: String, // encrypted
  tokenExpiry: Date,
  scopes: [String], // calendar permissions
  
  // Sync Settings
  syncEnabled: Boolean,
  syncDirection: String, // one-way-to-calendar, two-way, read-only
  autoSync: Boolean,
  syncFrequency: String, // real-time, hourly, daily
  lastSyncDate: Date,
  
  // Calendar Selection
  calendars: [{
    calendarId: String,
    calendarName: String,
    selected: Boolean, // which calendar to use for interviews
    color: String,
  }],
  defaultCalendarId: String,
  
  // Event Mapping
  eventPrefix: String, // prefix for interview events, e.g., "Interview: "
  eventColor: String,
  defaultReminders: [{
    method: String, // email, popup, notification
    minutes: Number, // before event
  }],
  
  // Conflict Detection Settings (UC-071)
  conflictDetection: {
    enabled: Boolean,
    lookAheadDays: Number,
    includePersonalEvents: Boolean,
    includeWorkEvents: Boolean,
    bufferMinutes: Number, // buffer time between events
  },
  
  // Synced Events
  syncedEvents: [{
    eventId: String, // provider's event ID
    interviewId: ObjectId, // ref: InterviewPreparation.scheduledInterviews
    lastSynced: Date,
    syncStatus: String, // success, failed, pending
  }],
  
  // Errors and Issues
  syncErrors: [{
    errorDate: Date,
    errorType: String,
    errorMessage: String,
    resolved: Boolean,
    resolvedDate: Date,
  }],
  
  // Metadata
  connectedAt: Date,
  lastAccessedAt: Date,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date,
}

// Indexes
db.calendarIntegration.createIndex({ userId: 1, provider: 1 })
db.calendarIntegration.createIndex({ userId: 1, active: 1 })
```

---

## Schema Relationships

### Primary Relationships
```
Users (from Sprint 1)
  ├─→ Jobs (1:N)
  │    ├─→ CompanyResearch (N:1)
  │    ├─→ JobMatchScores (1:1)
  │    ├─→ ApplicationMaterials (1:1)
  │    └─→ InterviewPreparation (1:1)
  │
  ├─→ Resumes (1:N)
  │    ├─→ ResumeCollaboration (1:1)
  │    └─→ ApplicationMaterials (1:N)
  │
  ├─→ CoverLetters (1:N)
  │    ├─→ CoverLetterPerformance (1:1)
  │    └─→ ApplicationMaterials (1:N)
  │
  ├─→ CompanyResearch (1:N)
  ├─→ JobMatchScores (1:N)
  ├─→ LearningResources (1:N)
  ├─→ InterviewPreparation (1:N)
  ├─→ ApplicationMaterials (1:N)
  ├─→ UserPreferences (1:1)
  ├─→ Analytics (1:1)
  └─→ CalendarIntegration (1:N)
```

### Cross-References
- Jobs ↔ Resumes (via ApplicationMaterials)
- Jobs ↔ CoverLetters (via ApplicationMaterials)
- Jobs ↔ CompanyResearch (via companyId)
- JobMatchScores → LearningResources (learning path generation)
- InterviewPreparation → CalendarIntegration (interview scheduling)
- CoverLetters → CoverLetterPerformance (effectiveness tracking)
- Resumes → ResumeCollaboration (feedback and sharing)

---

## Data Validation Rules

### Required Fields (Strictly Enforced)
- Jobs: `userId`, `title`, `company`, `status`
- Resumes: `userId`, `name`, `version`
- CoverLetters: `userId`, `name`, `jobId`
- CompanyResearch: `userId`, `companyName`
- JobMatchScores: `userId`, `jobId`, `overallScore`

### Field Constraints
- `salaryRange.min` ≤ `salaryRange.max`
- `status` must be from predefined list
- `jobDescription` max 2000 characters
- Email fields validated for format
- Date fields: `startDate` ≤ `endDate`
- Score fields: 0-100 range
- Percentage fields: 0-100 range

### Unique Constraints
- `(userId, companyName)` in CompanyResearch
- `(userId, jobId)` in JobMatchScores
- `(userId, jobId)` in ApplicationMaterials
- `shareableLink` in Resumes
- `shareToken` in ResumeCollaboration
- `userId` in UserPreferences
- `userId` in Analytics

---

## Index Strategy

### Performance Optimization
1. **Compound indexes** for common queries combining userId with filters
2. **Sort indexes** for frequently sorted fields (dates, scores)
3. **Text indexes** for search fields (searchKeywords in Jobs)
4. **Sparse indexes** for optional unique fields (shareableLink)

### Query Patterns Covered
- User's jobs by status: `userId + status`
- Upcoming deadlines: `userId + applicationDeadline`
- Resume versions: `userId + createdAt`
- Match scores ranking: `userId + overallScore`
- Recent company news: `news.publishDate`
- Interview schedule: `userId + scheduledInterviews.interviewDate`

---

## Schema Version
**Version**: 2.0.0
**Last Updated**: Sprint 2 Initial Design
**Compatibility**: Requires Sprint 1 Users, BasicInfo, EmploymentHistory, Skills, Education, Certifications, SpecialProjects collections

---

## Implementation Notes

### Migration from Sprint 1
- No changes required to existing Sprint 1 collections
- New collections created independently
- Cross-references to Sprint 1 profile data via ObjectIds

### AI Integration Points
- `aiMetadata` fields in Resumes and CoverLetters for tracking AI generation
- `aiOptimized` flags for tracking AI-enhanced content
- Store AI model, prompts, and generation metadata for debugging

### Security Considerations
- Encrypt sensitive fields: API tokens, passwords
- Hash passwords in ResumeCollaboration
- Validate all user inputs before storage
- Sanitize exported data
- Implement rate limiting for AI generation endpoints

### Performance Considerations
- Paginate large collections (Jobs, Resumes, CoverLetters)
- Cache frequently accessed data (CompanyResearch)
- Async processing for AI generation
- Background jobs for analytics calculation
- Index optimization based on query patterns

### Testing Requirements
- Unit tests for all CRUD operations
- Integration tests for cross-collection queries
- Test data validation and constraints
- Test index effectiveness
- Test AI integration error handling
- Test calendar integration failures
- Test concurrent updates
- Test data export functionality

---

## Future Enhancements (Post-Sprint 2)
- Job alerts and automated job discovery
- Email parsing for application status updates
- Browser extension for one-click job import
- Mobile app support
- Team collaboration features
- Advanced AI coaching and recommendations
- Integration with more job boards
- Video interview preparation tools
