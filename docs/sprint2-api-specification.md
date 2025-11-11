# Sprint 2 API Specification
*Complete Backend API Documentation for Job Search Platform*

## Table of Contents
1. [Authentication](#authentication)
2. [Jobs API](#jobs-api)
3. [Resumes API](#resumes-api)
4. [Cover Letters API](#cover-letters-api)
5. [Company Research API](#company-research-api)
6. [Job Matching API](#job-matching-api)
7. [Application Materials API](#application-materials-api)
8. [Interview Preparation API](#interview-preparation-api)
9. [Analytics API](#analytics-api)
10. [User Preferences API](#user-preferences-api)
11. [MongoDB Schemas](#mongodb-schemas)
12. [Error Handling](#error-handling)

---

## Authentication

All endpoints require JWT Bearer token authentication unless specified otherwise.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions

---

## Jobs API

### 1. Create Job (UC-036)
**Endpoint:** `POST /api/jobs`

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "locationType": "hybrid",
  "salaryMin": 120000,
  "salaryMax": 180000,
  "salaryFrequency": "yearly",
  "currency": "USD",
  "jobPostingUrl": "https://example.com/job/12345",
  "applicationDeadline": "2025-12-31T23:59:59Z",
  "description": "Job description text...",
  "requirements": ["5+ years experience", "React expertise"],
  "responsibilities": ["Lead development team", "Architect solutions"],
  "benefits": ["Health insurance", "401k matching"],
  "industry": "Technology",
  "jobType": "full-time",
  "experienceLevel": "senior",
  "status": "interested",
  "notes": "Personal notes about this opportunity",
  "contacts": [
    {
      "name": "John Recruiter",
      "role": "Technical Recruiter",
      "email": "john@techcorp.com",
      "phone": "+1-555-0100",
      "linkedIn": "https://linkedin.com/in/johnrecruiter"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "status": "interested",
    "createdAt": "2025-11-10T10:00:00Z",
    "updatedAt": "2025-11-10T10:00:00Z",
    // ... all other fields
  }
}
```

### 2. Get All Jobs (UC-039)
**Endpoint:** `GET /api/jobs`

**Query Parameters:**
- `search` (string): Search in title, company, description
- `status` (string): Filter by status (interested, applied, phone_screen, interview, offer, rejected, archived)
- `industry` (string): Filter by industry
- `location` (string): Filter by location
- `salaryMin` (number): Minimum salary filter
- `salaryMax` (number): Maximum salary filter
- `dateFrom` (ISO date): Filter jobs added after this date
- `dateTo` (ISO date): Filter jobs added before this date
- `sortBy` (string): Sort field (dateAdded, deadline, salary, company)
- `sortOrder` (string): asc or desc
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "status": "interested",
        "location": "San Francisco, CA",
        "salaryMin": 120000,
        "salaryMax": 180000,
        "applicationDeadline": "2025-12-31T23:59:59Z",
        "createdAt": "2025-11-10T10:00:00Z",
        "daysInCurrentStage": 5
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    },
    "statusCounts": {
      "interested": 12,
      "applied": 15,
      "phone_screen": 8,
      "interview": 6,
      "offer": 2,
      "rejected": 2
    }
  }
}
```

### 3. Get Job by ID (UC-038)
**Endpoint:** `GET /api/jobs/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "salaryMin": 120000,
    "salaryMax": 180000,
    "description": "Full job description...",
    "status": "applied",
    "statusHistory": [
      {
        "status": "interested",
        "timestamp": "2025-11-10T10:00:00Z",
        "notes": "Found on LinkedIn"
      },
      {
        "status": "applied",
        "timestamp": "2025-11-15T14:30:00Z",
        "notes": "Applied through company website"
      }
    ],
    "contacts": [],
    "notes": "Great company culture",
    "applicationDeadline": "2025-12-31T23:59:59Z",
    "createdAt": "2025-11-10T10:00:00Z",
    "updatedAt": "2025-11-15T14:30:00Z"
  }
}
```

### 4. Update Job (UC-038)
**Endpoint:** `PUT /api/jobs/:jobId`

**Request Body:** (All fields optional, only send fields to update)
```json
{
  "title": "Updated Job Title",
  "status": "phone_screen",
  "notes": "Updated notes",
  "applicationDeadline": "2025-12-31T23:59:59Z"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    // ... updated job object
  }
}
```

### 5. Update Job Status (UC-037)
**Endpoint:** `PATCH /api/jobs/:jobId/status`

**Request Body:**
```json
{
  "status": "interview",
  "notes": "First round interview scheduled"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "interview",
    "statusHistory": [
      // ... previous statuses
      {
        "status": "interview",
        "timestamp": "2025-11-20T09:00:00Z",
        "notes": "First round interview scheduled"
      }
    ],
    "updatedAt": "2025-11-20T09:00:00Z"
  }
}
```

### 6. Bulk Update Job Status (UC-037)
**Endpoint:** `PATCH /api/jobs/bulk-status`

**Request Body:**
```json
{
  "jobIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "status": "rejected",
  "notes": "Not moving forward"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "updated": 2,
    "failed": 0
  }
}
```

### 7. Import Job from URL (UC-041)
**Endpoint:** `POST /api/jobs/import-from-url`

**Request Body:**
```json
{
  "url": "https://www.linkedin.com/jobs/view/12345"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "importStatus": "success",
    "job": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "description": "Extracted job description...",
      "requirements": ["Extracted requirements"],
      "salaryMin": 120000,
      "salaryMax": 180000,
      "jobPostingUrl": "https://www.linkedin.com/jobs/view/12345",
      "importMetadata": {
        "source": "linkedin",
        "importedAt": "2025-11-10T10:00:00Z",
        "extractedFields": ["title", "company", "description", "requirements"]
      }
    },
    "warnings": ["Salary information not found"]
  }
}
```

### 8. Get Job Statistics (UC-044)
**Endpoint:** `GET /api/jobs/statistics`

**Query Parameters:**
- `dateFrom` (ISO date): Start date for statistics
- `dateTo` (ISO date): End date for statistics

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalJobs": 45,
    "byStatus": {
      "interested": 12,
      "applied": 15,
      "phone_screen": 8,
      "interview": 6,
      "offer": 2,
      "rejected": 2
    },
    "applicationResponseRate": 0.67,
    "averageTimeInStage": {
      "interested": 3.5,
      "applied": 7.2,
      "phone_screen": 4.8,
      "interview": 6.1
    },
    "monthlyApplications": [
      { "month": "2025-10", "count": 15 },
      { "month": "2025-11", "count": 20 }
    ],
    "deadlineAdherence": {
      "onTime": 38,
      "missed": 2,
      "percentage": 0.95
    },
    "averageTimeToOffer": 21.5
  }
}
```

### 9. Archive Job (UC-045)
**Endpoint:** `PATCH /api/jobs/:jobId/archive`

**Request Body:**
```json
{
  "reason": "Position filled",
  "notes": "Company hired internally"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isArchived": true,
    "archivedAt": "2025-11-20T10:00:00Z",
    "archiveReason": "Position filled"
  }
}
```

### 10. Restore Archived Job (UC-045)
**Endpoint:** `PATCH /api/jobs/:jobId/restore`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isArchived": false,
    "archivedAt": null
  }
}
```

### 11. Delete Job (UC-045)
**Endpoint:** `DELETE /api/jobs/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### 12. Get Upcoming Deadlines (UC-040)
**Endpoint:** `GET /api/jobs/deadlines/upcoming`

**Query Parameters:**
- `days` (number): Number of days to look ahead (default: 7)
- `limit` (number): Maximum number of results (default: 5)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "applicationDeadline": "2025-11-25T23:59:59Z",
      "daysRemaining": 5,
      "urgency": "medium",
      "status": "interested"
    }
  ]
}
```

---

## Resumes API

### 1. Create Resume (UC-046)
**Endpoint:** `POST /api/resumes`

**Request Body:**
```json
{
  "title": "Software Engineer Resume - Tech Companies",
  "templateId": "modern-professional",
  "isDefault": false,
  "contactInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",
    "linkedIn": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "summary": "Experienced software engineer with 5+ years...",
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Software Engineer",
      "location": "San Francisco, CA",
      "startDate": "2020-06-01",
      "endDate": null,
      "isCurrent": true,
      "description": "Lead developer for...",
      "achievements": [
        "Increased performance by 40%",
        "Led team of 5 engineers"
      ],
      "technologies": ["React", "Node.js", "MongoDB"]
    }
  ],
  "skills": {
    "technical": [
      { "name": "React", "proficiency": "expert" },
      { "name": "Node.js", "proficiency": "advanced" }
    ],
    "soft": ["Leadership", "Communication"]
  },
  "education": [
    {
      "institution": "University of California",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "Berkeley, CA",
      "graduationDate": "2018-05-15",
      "gpa": 3.8,
      "honors": ["Cum Laude"]
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built full-stack platform...",
      "technologies": ["React", "Node.js"],
      "url": "https://github.com/johndoe/ecommerce",
      "startDate": "2023-01-01",
      "endDate": "2023-06-01"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect",
      "issuer": "Amazon Web Services",
      "issueDate": "2023-03-15",
      "expiryDate": "2026-03-15",
      "credentialId": "AWS-1234567",
      "url": "https://aws.amazon.com/verification/1234567"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439011",
    "userId": "user123",
    "title": "Software Engineer Resume - Tech Companies",
    "version": 1,
    "isDefault": false,
    "createdAt": "2025-11-10T10:00:00Z",
    "updatedAt": "2025-11-10T10:00:00Z",
    // ... all other fields
  }
}
```

### 2. Generate AI Resume (UC-047)
**Endpoint:** `POST /api/resumes/generate-ai`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "baseResumeId": "607f1f77bcf86cd799439011",
  "focusAreas": ["leadership", "technical_skills"],
  "tone": "professional",
  "maxLength": "one_page"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "userId": "user123",
    "title": "AI Generated - Senior Software Engineer at Tech Corp",
    "version": 1,
    "aiMetadata": {
      "isAIGenerated": true,
      "generatedAt": "2025-11-10T10:00:00Z",
      "model": "gpt-4",
      "prompt": "Generate resume tailored for...",
      "baseResumeId": "607f1f77bcf86cd799439011",
      "jobId": "507f1f77bcf86cd799439011",
      "focusAreas": ["leadership", "technical_skills"],
      "optimizationsApplied": [
        "Added ATS keywords",
        "Highlighted leadership experience",
        "Emphasized relevant technologies"
      ]
    },
    "summary": "AI-generated tailored summary...",
    "experience": [
      // Tailored experience entries with optimized descriptions
    ],
    "skills": {
      // Reordered and optimized skills
    }
  }
}
```

### 3. Get All Resumes (UC-046)
**Endpoint:** `GET /api/resumes`

**Query Parameters:**
- `search` (string): Search in title
- `isDefault` (boolean): Filter default resumes
- `templateId` (string): Filter by template
- `sortBy` (string): updatedAt, createdAt, title
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "_id": "607f1f77bcf86cd799439011",
        "title": "Software Engineer Resume",
        "version": 3,
        "isDefault": true,
        "templateId": "modern-professional",
        "lastModified": "2025-11-10T10:00:00Z",
        "usageCount": 5,
        "linkedApplications": 3
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 4. Get Resume by ID (UC-046)
**Endpoint:** `GET /api/resumes/:resumeId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439011",
    // ... full resume object
  }
}
```

### 5. Update Resume (UC-048, UC-053)
**Endpoint:** `PUT /api/resumes/:resumeId`

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Resume Title",
  "summary": "Updated summary...",
  "experience": [/* updated experience */],
  "sectionsOrder": ["summary", "experience", "skills", "education"],
  "sectionsEnabled": {
    "summary": true,
    "experience": true,
    "skills": true,
    "education": true,
    "projects": false,
    "certifications": true
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439011",
    "version": 4,
    // ... updated resume
  }
}
```

### 6. Optimize Resume Skills (UC-049)
**Endpoint:** `POST /api/resumes/:resumeId/optimize-skills`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "originalSkills": [
      { "name": "React", "proficiency": "expert" }
    ],
    "optimizedSkills": [
      { "name": "React", "proficiency": "expert", "relevanceScore": 0.98 }
    ],
    "suggestedSkills": [
      { "name": "TypeScript", "reason": "Required in job posting", "priority": "high" }
    ],
    "skillsToEmphasize": ["React", "Node.js"],
    "matchScore": 0.85,
    "gaps": [
      { "skill": "Kubernetes", "importance": "medium" }
    ]
  }
}
```

### 7. Tailor Resume Experience (UC-050)
**Endpoint:** `POST /api/resumes/:resumeId/tailor-experience`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "tailoredExperience": [
      {
        "experienceId": "exp1",
        "originalDescription": "Worked on web applications",
        "tailoredDescription": "Led development of scalable web applications using React and Node.js, improving performance by 40%",
        "suggestedBullets": [
          "Architected microservices handling 1M+ requests daily",
          "Mentored team of 5 junior developers"
        ],
        "relevanceScore": 0.92,
        "improvements": [
          "Added quantified metrics",
          "Emphasized leadership",
          "Included relevant technologies"
        ]
      }
    ]
  }
}
```

### 8. Export Resume (UC-051)
**Endpoint:** `POST /api/resumes/:resumeId/export`

**Request Body:**
```json
{
  "format": "pdf",
  "theme": "professional",
  "includeWatermark": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.example.com/resumes/resume-123.pdf",
    "expiresAt": "2025-11-11T10:00:00Z",
    "format": "pdf",
    "fileSize": 245760
  }
}
```

### 9. Compare Resume Versions (UC-052)
**Endpoint:** `GET /api/resumes/compare`

**Query Parameters:**
- `resumeId1` (string): First resume ID
- `resumeId2` (string): Second resume ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "resume1": {
      "_id": "607f1f77bcf86cd799439011",
      "title": "Resume Version 1",
      "version": 1
    },
    "resume2": {
      "_id": "607f1f77bcf86cd799439012",
      "title": "Resume Version 2",
      "version": 2
    },
    "differences": {
      "summary": {
        "changed": true,
        "version1": "Original summary...",
        "version2": "Updated summary..."
      },
      "experience": {
        "added": [/* new experience entries */],
        "removed": [/* removed entries */],
        "modified": [/* changed entries */]
      },
      "skills": {
        "added": ["TypeScript", "Docker"],
        "removed": ["jQuery"]
      }
    }
  }
}
```

### 10. Validate Resume (UC-053)
**Endpoint:** `POST /api/resumes/:resumeId/validate`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "score": 75,
    "issues": [
      {
        "severity": "warning",
        "category": "length",
        "message": "Resume exceeds 2 pages",
        "suggestion": "Consider condensing experience section"
      },
      {
        "severity": "error",
        "category": "contact",
        "message": "Invalid email format"
      }
    ],
    "suggestions": [
      "Add more quantifiable achievements",
      "Use stronger action verbs",
      "Include keywords from job description"
    ],
    "completeness": {
      "summary": true,
      "experience": true,
      "skills": true,
      "education": true,
      "contact": false
    }
  }
}
```

### 11. Share Resume for Collaboration (UC-054)
**Endpoint:** `POST /api/resumes/:resumeId/share`

**Request Body:**
```json
{
  "expiresAt": "2025-12-10T10:00:00Z",
  "allowComments": true,
  "allowEditing": false,
  "requirePassword": false,
  "password": ""
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "shareToken": "abc123def456",
    "shareUrl": "https://app.example.com/shared/resumes/abc123def456",
    "expiresAt": "2025-12-10T10:00:00Z",
    "accessControl": {
      "allowComments": true,
      "allowEditing": false,
      "requirePassword": false
    }
  }
}
```

### 12. Delete Resume (UC-052)
**Endpoint:** `DELETE /api/resumes/:resumeId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

---

## Cover Letters API

### 1. Create Cover Letter (UC-055)
**Endpoint:** `POST /api/cover-letters`

**Request Body:**
```json
{
  "title": "Cover Letter - Tech Corp",
  "jobId": "507f1f77bcf86cd799439011",
  "templateId": "professional-standard",
  "recipientInfo": {
    "name": "Jane Smith",
    "title": "Hiring Manager",
    "company": "Tech Corp",
    "address": "123 Tech Street, San Francisco, CA 94102"
  },
  "content": {
    "opening": "Dear Ms. Smith,",
    "introduction": "I am writing to express...",
    "body": [
      "First body paragraph...",
      "Second body paragraph..."
    ],
    "closing": "I look forward to discussing...",
    "signature": "Sincerely,\nJohn Doe"
  },
  "tone": "professional",
  "style": "formal"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "707f1f77bcf86cd799439011",
    "userId": "user123",
    "jobId": "507f1f77bcf86cd799439011",
    "title": "Cover Letter - Tech Corp",
    "version": 1,
    "createdAt": "2025-11-10T10:00:00Z",
    // ... all other fields
  }
}
```

### 2. Generate AI Cover Letter (UC-056, UC-057)
**Endpoint:** `POST /api/cover-letters/generate-ai`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "resumeId": "607f1f77bcf86cd799439011",
  "tone": "enthusiastic",
  "style": "narrative",
  "includeCompanyResearch": true,
  "focusAreas": ["technical_skills", "leadership"],
  "length": "standard"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "707f1f77bcf86cd799439012",
    "userId": "user123",
    "jobId": "507f1f77bcf86cd799439011",
    "title": "AI Generated - Senior Software Engineer at Tech Corp",
    "content": {
      "opening": "Dear Hiring Manager,",
      "introduction": "AI-generated introduction highlighting recent company news...",
      "body": [
        "First paragraph emphasizing relevant experience...",
        "Second paragraph showcasing technical expertise..."
      ],
      "closing": "I am excited about the opportunity...",
      "signature": "Sincerely,\nJohn Doe"
    },
    "aiMetadata": {
      "isAIGenerated": true,
      "generatedAt": "2025-11-10T10:00:00Z",
      "model": "gpt-4",
      "prompt": "Generate cover letter for...",
      "companyResearchUsed": true,
      "companyResearchSummary": "Tech Corp recently launched...",
      "toneAchieved": "enthusiastic",
      "styleApplied": "narrative"
    },
    "companyResearchIntegration": {
      "newsReferences": [
        {
          "newsId": "news123",
          "title": "Tech Corp raises $50M Series B",
          "integratedIn": "introduction",
          "context": "Your recent Series B funding..."
        }
      ],
      "missionAlignment": "Aligned with Tech Corp's mission to...",
      "cultureMatch": "Emphasized collaborative work style"
    }
  }
}
```

### 3. Get All Cover Letters (UC-055)
**Endpoint:** `GET /api/cover-letters`

**Query Parameters:**
- `jobId` (string): Filter by job
- `search` (string): Search in title
- `sortBy` (string): createdAt, updatedAt
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "coverLetters": [
      {
        "_id": "707f1f77bcf86cd799439011",
        "title": "Cover Letter - Tech Corp",
        "jobId": "507f1f77bcf86cd799439011",
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "version": 2,
        "createdAt": "2025-11-10T10:00:00Z",
        "lastModified": "2025-11-11T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 4. Get Cover Letter by ID (UC-055)
**Endpoint:** `GET /api/cover-letters/:coverLetterId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "707f1f77bcf86cd799439011",
    // ... full cover letter object
  }
}
```

### 5. Update Cover Letter (UC-060)
**Endpoint:** `PUT /api/cover-letters/:coverLetterId`

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "content": {
    "introduction": "Updated introduction...",
    "body": ["Updated body paragraphs..."]
  },
  "tone": "formal",
  "editHistory": [
    {
      "timestamp": "2025-11-11T10:00:00Z",
      "changes": ["Updated introduction"],
      "editor": "user123"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "707f1f77bcf86cd799439011",
    "version": 3,
    // ... updated cover letter
  }
}
```

### 6. Customize Cover Letter Tone (UC-058)
**Endpoint:** `POST /api/cover-letters/:coverLetterId/customize-tone`

**Request Body:**
```json
{
  "tone": "casual",
  "style": "bullet_points",
  "customInstructions": "Make it more startup-friendly"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "originalContent": {
      "introduction": "Original formal introduction..."
    },
    "customizedContent": {
      "introduction": "Customized casual introduction..."
    },
    "changes": [
      "Adjusted tone from formal to casual",
      "Restructured to bullet points",
      "Added startup-friendly language"
    ]
  }
}
```

### 7. Highlight Experience in Cover Letter (UC-059)
**Endpoint:** `POST /api/cover-letters/:coverLetterId/highlight-experience`

**Request Body:**
```json
{
  "experienceIds": ["exp1", "exp2"],
  "emphasis": "strong"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "updatedContent": {
      "body": [
        "Enhanced paragraph emphasizing selected experience..."
      ]
    },
    "experiencesHighlighted": [
      {
        "experienceId": "exp1",
        "relevanceScore": 0.95,
        "quantifiedAchievements": [
          "Increased performance by 40%"
        ]
      }
    ]
  }
}
```

### 8. Export Cover Letter (UC-061)
**Endpoint:** `POST /api/cover-letters/:coverLetterId/export`

**Request Body:**
```json
{
  "format": "pdf",
  "includeLetterhead": true,
  "letterheadConfig": {
    "logo": "https://example.com/logo.png",
    "address": "123 Main St"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.example.com/cover-letters/letter-123.pdf",
    "expiresAt": "2025-11-11T10:00:00Z",
    "format": "pdf",
    "fileSize": 156780
  }
}
```

### 9. Get Cover Letter Performance (UC-062)
**Endpoint:** `GET /api/cover-letters/:coverLetterId/performance`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "coverLetterId": "707f1f77bcf86cd799439011",
    "linkedApplications": [
      {
        "jobId": "507f1f77bcf86cd799439011",
        "applicationDate": "2025-11-10T10:00:00Z",
        "outcome": "interview",
        "responseTime": 5
      }
    ],
    "metrics": {
      "totalApplications": 3,
      "responseRate": 0.67,
      "interviewRate": 0.33,
      "averageResponseTime": 6.5
    },
    "templateAnalysis": {
      "templateId": "professional-standard",
      "successRate": 0.67,
      "comparedToAverage": 0.15
    },
    "recommendations": [
      "This template performs well for technical roles",
      "Consider A/B testing with more casual tone"
    ]
  }
}
```

### 10. Delete Cover Letter
**Endpoint:** `DELETE /api/cover-letters/:coverLetterId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cover letter deleted successfully"
}
```

---

## Company Research API

### 1. Research Company (UC-063)
**Endpoint:** `POST /api/company-research/research`

**Request Body:**
```json
{
  "companyName": "Tech Corp",
  "website": "https://techcorp.com",
  "includeNews": true,
  "includeFinancials": true,
  "includeLeadership": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "807f1f77bcf86cd799439011",
    "userId": "user123",
    "companyName": "Tech Corp",
    "basicInfo": {
      "website": "https://techcorp.com",
      "industry": "Technology",
      "headquarters": "San Francisco, CA",
      "founded": 2010,
      "size": "1000-5000",
      "type": "Private"
    },
    "profile": {
      "mission": "To revolutionize...",
      "values": ["Innovation", "Integrity"],
      "culture": "Fast-paced startup culture...",
      "products": ["Product A", "Product B"]
    },
    "leadership": [
      {
        "name": "Jane CEO",
        "title": "Chief Executive Officer",
        "bio": "Jane has over 20 years...",
        "linkedIn": "https://linkedin.com/in/janeceo",
        "background": "Previously at BigTech Corp"
      }
    ],
    "news": [
      {
        "title": "Tech Corp raises $50M Series B",
        "source": "TechCrunch",
        "date": "2025-10-15",
        "url": "https://techcrunch.com/...",
        "summary": "Tech Corp announced...",
        "category": "funding"
      }
    ],
    "ratings": {
      "glassdoor": {
        "overall": 4.2,
        "culture": 4.5,
        "workLife": 3.8,
        "benefits": 4.0,
        "url": "https://glassdoor.com/..."
      }
    },
    "competitiveLandscape": {
      "mainCompetitors": ["Competitor A", "Competitor B"],
      "marketPosition": "Leading innovator in...",
      "differentiators": ["Advanced AI", "Global scale"]
    },
    "researchSummary": {
      "strengths": ["Strong funding", "Innovative products"],
      "concerns": ["Work-life balance", "Rapid growth challenges"],
      "interviewTips": [
        "Emphasize adaptability",
        "Show passion for innovation"
      ]
    },
    "lastResearchedAt": "2025-11-10T10:00:00Z"
  }
}
```

### 2. Get Company Research (UC-063)
**Endpoint:** `GET /api/company-research/:companyId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... full company research object
  }
}
```

### 3. Get Company by Name
**Endpoint:** `GET /api/company-research/by-name/:companyName`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... company research object
  }
}
```

### 4. Get Company News (UC-064)
**Endpoint:** `GET /api/company-research/:companyId/news`

**Query Parameters:**
- `category` (string): Filter by news category (funding, product, hiring, etc.)
- `dateFrom` (ISO date): News after this date
- `dateTo` (ISO date): News before this date
- `limit` (number): Maximum number of results

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "companyName": "Tech Corp",
    "news": [
      {
        "title": "Tech Corp launches new AI product",
        "source": "TechCrunch",
        "date": "2025-11-05",
        "url": "https://techcrunch.com/...",
        "summary": "Company announces...",
        "category": "product",
        "relevanceScore": 0.95,
        "sentiment": "positive",
        "keyPoints": [
          "New AI-powered analytics platform",
          "Partnership with major tech companies",
          "Expected to increase revenue by 30%"
        ]
      }
    ],
    "total": 15,
    "categoryCounts": {
      "funding": 3,
      "product": 5,
      "hiring": 4,
      "leadership": 2,
      "other": 1
    }
  }
}
```

### 5. Update Company Research
**Endpoint:** `POST /api/company-research/:companyId/refresh`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "807f1f77bcf86cd799439011",
    "lastResearchedAt": "2025-11-10T12:00:00Z",
    "updatedFields": ["news", "leadership", "ratings"],
    "newNewsCount": 3
  }
}
```

### 6. Get All Researched Companies
**Endpoint:** `GET /api/company-research`

**Query Parameters:**
- `search` (string): Search company names
- `industry` (string): Filter by industry
- `sortBy` (string): Sort field
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "_id": "807f1f77bcf86cd799439011",
        "companyName": "Tech Corp",
        "industry": "Technology",
        "size": "1000-5000",
        "lastResearchedAt": "2025-11-10T10:00:00Z",
        "linkedJobsCount": 3,
        "recentNews": 5
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

## Job Matching API

### 1. Calculate Job Match Score (UC-065)
**Endpoint:** `POST /api/job-matching/calculate`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "resumeId": "607f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "907f1f77bcf86cd799439011",
    "userId": "user123",
    "jobId": "507f1f77bcf86cd799439011",
    "overallScore": 0.82,
    "categoryScores": {
      "skills": {
        "score": 0.85,
        "weight": 0.4,
        "details": {
          "requiredSkillsMatch": 0.9,
          "preferredSkillsMatch": 0.7,
          "matchedSkills": ["React", "Node.js", "MongoDB"],
          "missingSkills": ["Kubernetes", "Docker"]
        }
      },
      "experience": {
        "score": 0.80,
        "weight": 0.3,
        "details": {
          "yearsRequired": 5,
          "yearsHave": 6,
          "relevantExperience": 0.85,
          "industryMatch": true
        }
      },
      "education": {
        "score": 1.0,
        "weight": 0.15,
        "details": {
          "degreeMatch": true,
          "fieldMatch": true,
          "institutionPrestige": 0.8
        }
      },
      "certifications": {
        "score": 0.6,
        "weight": 0.15,
        "details": {
          "requiredCertifications": ["AWS"],
          "haveCertifications": ["AWS"],
          "relevantCertifications": 0.6
        }
      }
    },
    "strengths": [
      "Strong technical skills match (85%)",
      "Exceeds experience requirements",
      "Relevant industry experience"
    ],
    "gaps": [
      {
        "category": "skills",
        "item": "Kubernetes",
        "importance": "high",
        "impact": 0.05
      },
      {
        "category": "skills",
        "item": "Docker",
        "importance": "medium",
        "impact": 0.03
      }
    ],
    "recommendations": [
      "Complete Kubernetes certification to increase match score by 5%",
      "Highlight Docker experience from projects",
      "Emphasize leadership experience in application"
    ],
    "calculatedAt": "2025-11-10T10:00:00Z"
  }
}
```

### 2. Get Job Match Score (UC-065)
**Endpoint:** `GET /api/job-matching/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... job match score object
  }
}
```

### 3. Get Skills Gap Analysis (UC-066)
**Endpoint:** `GET /api/job-matching/:jobId/skills-gap`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "507f1f77bcf86cd799439011",
    "jobTitle": "Senior Software Engineer",
    "overallGap": 0.18,
    "detailedGaps": [
      {
        "skill": "Kubernetes",
        "currentLevel": "none",
        "requiredLevel": "intermediate",
        "gap": 0.6,
        "priority": "high",
        "estimatedLearningTime": "2-3 months",
        "resources": [
          {
            "title": "Kubernetes Fundamentals",
            "type": "course",
            "provider": "Udemy",
            "duration": "20 hours",
            "url": "https://udemy.com/...",
            "rating": 4.6
          }
        ]
      },
      {
        "skill": "Docker",
        "currentLevel": "beginner",
        "requiredLevel": "advanced",
        "gap": 0.5,
        "priority": "medium",
        "estimatedLearningTime": "1-2 months",
        "resources": []
      }
    ],
    "learningPath": [
      {
        "phase": 1,
        "skills": ["Docker"],
        "duration": "1-2 months",
        "goal": "Achieve intermediate proficiency"
      },
      {
        "phase": 2,
        "skills": ["Kubernetes"],
        "duration": "2-3 months",
        "goal": "Achieve intermediate proficiency"
      }
    ],
    "projectedMatchScoreAfterGapClosure": 0.92
  }
}
```

### 4. Get Learning Resources (UC-066)
**Endpoint:** `GET /api/job-matching/:jobId/learning-resources`

**Query Parameters:**
- `skillName` (string): Specific skill to get resources for

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "507f1f77bcf86cd799439011",
    "resources": [
      {
        "skill": "Kubernetes",
        "resources": [
          {
            "title": "Kubernetes Fundamentals",
            "type": "course",
            "provider": "Udemy",
            "duration": "20 hours",
            "price": 49.99,
            "currency": "USD",
            "url": "https://udemy.com/...",
            "rating": 4.6,
            "difficulty": "beginner",
            "completionRate": null
          },
          {
            "title": "Official Kubernetes Documentation",
            "type": "documentation",
            "provider": "Kubernetes",
            "duration": null,
            "price": 0,
            "url": "https://kubernetes.io/docs/",
            "difficulty": "all levels"
          }
        ]
      }
    ]
  }
}
```

### 5. Compare Match Scores
**Endpoint:** `GET /api/job-matching/compare`

**Query Parameters:**
- `jobIds` (string): Comma-separated job IDs

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "jobId": "507f1f77bcf86cd799439011",
        "jobTitle": "Senior Software Engineer",
        "company": "Tech Corp",
        "overallScore": 0.82,
        "rank": 1
      },
      {
        "jobId": "507f1f77bcf86cd799439012",
        "jobTitle": "Lead Developer",
        "company": "Startup Inc",
        "overallScore": 0.75,
        "rank": 2
      }
    ],
    "recommendations": [
      "Tech Corp position is your best match",
      "Focus application efforts on top 3 matches"
    ]
  }
}
```

---

## Application Materials API

### 1. Link Materials to Job (UC-042)
**Endpoint:** `POST /api/application-materials`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "resumeId": "607f1f77bcf86cd799439011",
  "coverLetterId": "707f1f77bcf86cd799439011",
  "portfolioUrl": "https://johndoe.dev",
  "additionalDocuments": [
    {
      "name": "References",
      "url": "https://storage.example.com/references.pdf",
      "type": "references"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "a07f1f77bcf86cd799439011",
    "userId": "user123",
    "jobId": "507f1f77bcf86cd799439011",
    "resumeUsed": {
      "resumeId": "607f1f77bcf86cd799439011",
      "version": 3,
      "title": "Software Engineer Resume",
      "linkedAt": "2025-11-10T10:00:00Z"
    },
    "coverLetterUsed": {
      "coverLetterId": "707f1f77bcf86cd799439011",
      "version": 2,
      "title": "Cover Letter - Tech Corp",
      "linkedAt": "2025-11-10T10:00:00Z"
    },
    "portfolioUrl": "https://johndoe.dev",
    "additionalDocuments": [],
    "createdAt": "2025-11-10T10:00:00Z"
  }
}
```

### 2. Get Application Materials (UC-042)
**Endpoint:** `GET /api/application-materials/job/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "a07f1f77bcf86cd799439011",
    "jobId": "507f1f77bcf86cd799439011",
    "resumeUsed": {
      "resumeId": "607f1f77bcf86cd799439011",
      "version": 3,
      "title": "Software Engineer Resume",
      "linkedAt": "2025-11-10T10:00:00Z",
      "downloadUrl": "https://storage.example.com/resume.pdf"
    },
    "coverLetterUsed": {
      "coverLetterId": "707f1f77bcf86cd799439011",
      "version": 2,
      "title": "Cover Letter - Tech Corp",
      "linkedAt": "2025-11-10T10:00:00Z",
      "downloadUrl": "https://storage.example.com/cover-letter.pdf"
    },
    "updateHistory": [
      {
        "timestamp": "2025-11-10T10:00:00Z",
        "changes": ["Initial materials linked"],
        "updatedBy": "user123"
      }
    ]
  }
}
```

### 3. Update Application Materials (UC-042)
**Endpoint:** `PUT /api/application-materials/:materialId`

**Request Body:**
```json
{
  "resumeId": "607f1f77bcf86cd799439012",
  "coverLetterId": "707f1f77bcf86cd799439012"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "a07f1f77bcf86cd799439011",
    // ... updated materials
  }
}
```

### 4. Get Materials Usage Analytics
**Endpoint:** `GET /api/application-materials/analytics`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mostUsedResumes": [
      {
        "resumeId": "607f1f77bcf86cd799439011",
        "title": "Software Engineer Resume",
        "usageCount": 15,
        "successRate": 0.67
      }
    ],
    "mostUsedCoverLetters": [
      {
        "coverLetterId": "707f1f77bcf86cd799439011",
        "title": "Professional Cover Letter",
        "usageCount": 12,
        "successRate": 0.58
      }
    ],
    "tailoringRate": 0.85,
    "optimizationScore": 0.78
  }
}
```

---

## Interview Preparation API

### 1. Create Interview Preparation (UC-068)
**Endpoint:** `POST /api/interview-preparation`

**Request Body:**
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "companyId": "807f1f77bcf86cd799439011"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "i07f1f77bcf86cd799439011",
    "userId": "user123",
    "jobId": "507f1f77bcf86cd799439011",
    "companyId": "807f1f77bcf86cd799439011",
    "interviewProcess": {
      "stages": [
        {
          "name": "Phone Screen",
          "duration": "30 minutes",
          "format": "phone",
          "description": "Initial screening with recruiter"
        },
        {
          "name": "Technical Interview",
          "duration": "60 minutes",
          "format": "video",
          "description": "Coding challenge and system design"
        }
      ],
      "typicalDuration": "2-3 weeks",
      "decisionTimeline": "1-2 weeks after final interview"
    },
    "commonQuestions": [
      {
        "question": "Tell me about yourself",
        "category": "behavioral",
        "difficulty": "easy",
        "suggestedAnswer": "Structure your answer using...",
        "keyPoints": [
          "Current role and responsibilities",
          "Relevant achievements",
          "Career goals"
        ]
      },
      {
        "question": "Explain a time you resolved a technical conflict",
        "category": "behavioral",
        "difficulty": "medium",
        "suggestedAnswer": "Use STAR method...",
        "keyPoints": [
          "Situation",
          "Task",
          "Action",
          "Result"
        ]
      },
      {
        "question": "Design a URL shortener",
        "category": "technical",
        "difficulty": "medium",
        "suggestedAnswer": "Consider scalability...",
        "keyPoints": [
          "Database schema",
          "Hashing algorithm",
          "Caching strategy"
        ]
      }
    ],
    "interviewers": [
      {
        "name": "Jane Smith",
        "title": "Engineering Manager",
        "linkedIn": "https://linkedin.com/in/janesmith",
        "background": "Previously at BigTech, 10 years experience",
        "interviewFocus": "Leadership and team collaboration"
      }
    ],
    "companySpecificFormat": {
      "hasWhiteboardCoding": true,
      "hasTakeHomeAssignment": false,
      "hasSystemDesign": true,
      "hasBehavioralRound": true,
      "uniqueAspects": [
        "Values assessment round",
        "Team lunch meeting"
      ]
    },
    "preparationRecommendations": [
      "Review system design patterns",
      "Practice STAR method responses",
      "Research company's latest products",
      "Prepare questions about team structure"
    ],
    "successTips": [
      "Emphasize collaborative approach",
      "Show enthusiasm for company mission",
      "Ask thoughtful questions about tech stack"
    ],
    "checklist": [
      {
        "category": "Research",
        "items": [
          { "task": "Study company website", "completed": false },
          { "task": "Read recent news", "completed": false }
        ]
      },
      {
        "category": "Technical Prep",
        "items": [
          { "task": "Review algorithms", "completed": false },
          { "task": "Practice system design", "completed": false }
        ]
      }
    ],
    "createdAt": "2025-11-10T10:00:00Z"
  }
}
```

### 2. Get Interview Preparation (UC-068)
**Endpoint:** `GET /api/interview-preparation/:prepId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... full interview preparation object
  }
}
```

### 3. Get Interview Preparation by Job
**Endpoint:** `GET /api/interview-preparation/job/:jobId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... interview preparation object
  }
}
```

### 4. Update Preparation Checklist
**Endpoint:** `PATCH /api/interview-preparation/:prepId/checklist`

**Request Body:**
```json
{
  "category": "Research",
  "taskIndex": 0,
  "completed": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "checklist": [
      {
        "category": "Research",
        "items": [
          { "task": "Study company website", "completed": true }
        ]
      }
    ],
    "overallProgress": 0.15
  }
}
```

### 5. Schedule Interview (UC-071)
**Endpoint:** `POST /api/interview-preparation/:prepId/schedule`

**Request Body:**
```json
{
  "interviewType": "technical",
  "scheduledDate": "2025-11-20T14:00:00Z",
  "duration": 60,
  "format": "video",
  "location": "Zoom",
  "meetingLink": "https://zoom.us/j/123456",
  "interviewers": ["Jane Smith", "John Doe"],
  "notes": "Bring laptop for coding exercise"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "int123",
      "type": "technical",
      "scheduledDate": "2025-11-20T14:00:00Z",
      "duration": 60,
      "format": "video",
      "location": "Zoom",
      "meetingLink": "https://zoom.us/j/123456",
      "interviewers": ["Jane Smith", "John Doe"],
      "calendarIntegration": {
        "eventId": "cal_event_123",
        "provider": "google",
        "synced": true
      },
      "reminders": [
        {
          "type": "email",
          "time": "2025-11-19T14:00:00Z",
          "sent": false
        },
        {
          "type": "notification",
          "time": "2025-11-20T12:00:00Z",
          "sent": false
        }
      ]
    }
  }
}
```

### 6. Record Interview Outcome
**Endpoint:** `POST /api/interview-preparation/:prepId/outcome`

**Request Body:**
```json
{
  "interviewId": "int123",
  "outcome": "passed",
  "feedback": "Strong technical skills, good communication",
  "nextSteps": "Await final round invitation",
  "performanceNotes": {
    "technical": 8,
    "communication": 9,
    "cultural_fit": 8
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "interview": {
      "id": "int123",
      "outcome": "passed",
      "feedback": "Strong technical skills, good communication",
      "completedAt": "2025-11-20T15:30:00Z"
    }
  }
}
```

---

## Analytics API

### 1. Get Dashboard Analytics (UC-072)
**Endpoint:** `GET /api/analytics/dashboard`

**Query Parameters:**
- `dateFrom` (ISO date): Start date
- `dateTo` (ISO date): End date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "period": {
      "from": "2025-10-01T00:00:00Z",
      "to": "2025-11-10T23:59:59Z"
    },
    "jobStatistics": {
      "totalJobsTracked": 45,
      "activeJobs": 38,
      "archivedJobs": 7,
      "byStatus": {
        "interested": 12,
        "applied": 15,
        "phone_screen": 8,
        "interview": 6,
        "offer": 2,
        "rejected": 2
      },
      "byIndustry": {
        "Technology": 30,
        "Finance": 10,
        "Healthcare": 5
      },
      "averageSalaryRange": {
        "min": 120000,
        "max": 180000,
        "currency": "USD"
      }
    },
    "applicationPipeline": {
      "conversionRates": {
        "applied_to_phone_screen": 0.53,
        "phone_screen_to_interview": 0.75,
        "interview_to_offer": 0.33
      },
      "averageTimeInStage": {
        "interested": 3.5,
        "applied": 7.2,
        "phone_screen": 4.8,
        "interview": 6.1
      },
      "totalApplications": 15,
      "successRate": 0.13,
      "averageResponseTime": 6.5
    },
    "timeToHire": {
      "average": 28.5,
      "fastest": 14,
      "slowest": 45
    },
    "activityTrends": {
      "applicationsPerWeek": [
        { "week": "2025-W44", "count": 4 },
        { "week": "2025-W45", "count": 6 }
      ],
      "interviewsPerWeek": [
        { "week": "2025-W44", "count": 2 },
        { "week": "2025-W45", "count": 3 }
      ]
    },
    "materialEffectiveness": {
      "resumeUsage": {
        "mostSuccessful": {
          "resumeId": "607f1f77bcf86cd799439011",
          "title": "Software Engineer Resume",
          "successRate": 0.75
        }
      },
      "coverLetterUsage": {
        "mostSuccessful": {
          "coverLetterId": "707f1f77bcf86cd799439011",
          "title": "Professional Cover Letter",
          "successRate": 0.67
        }
      }
    },
    "benchmarking": {
      "industryAverages": {
        "responseRate": 0.45,
        "interviewRate": 0.25,
        "offerRate": 0.08
      },
      "yourPerformance": {
        "responseRate": 0.53,
        "interviewRate": 0.27,
        "offerRate": 0.13
      },
      "comparison": {
        "responseRate": "+17.8%",
        "interviewRate": "+8.0%",
        "offerRate": "+62.5%"
      }
    },
    "recommendations": [
      "Your response rate is above industry average",
      "Consider applying to more positions in Technology sector",
      "Follow up on 3 applications pending for over 2 weeks"
    ],
    "goals": {
      "weeklyApplications": {
        "target": 5,
        "current": 4,
        "progress": 0.8
      },
      "targetOffers": {
        "target": 3,
        "current": 2,
        "progress": 0.67
      }
    },
    "generatedAt": "2025-11-10T10:00:00Z"
  }
}
```

### 2. Get Application Funnel Analytics
**Endpoint:** `GET /api/analytics/funnel`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "funnel": [
      {
        "stage": "interested",
        "count": 45,
        "percentage": 100,
        "averageDuration": 3.5
      },
      {
        "stage": "applied",
        "count": 15,
        "percentage": 33.3,
        "averageDuration": 7.2
      },
      {
        "stage": "phone_screen",
        "count": 8,
        "percentage": 17.8,
        "averageDuration": 4.8
      },
      {
        "stage": "interview",
        "count": 6,
        "percentage": 13.3,
        "averageDuration": 6.1
      },
      {
        "stage": "offer",
        "count": 2,
        "percentage": 4.4,
        "averageDuration": null
      }
    ],
    "dropoffAnalysis": [
      {
        "from": "interested",
        "to": "applied",
        "dropoff": 30,
        "dropoffRate": 0.667,
        "suggestions": ["Improve resume tailoring", "Apply faster to more positions"]
      }
    ]
  }
}
```

### 3. Export Analytics Report
**Endpoint:** `POST /api/analytics/export`

**Request Body:**
```json
{
  "reportType": "comprehensive",
  "format": "pdf",
  "dateFrom": "2025-10-01T00:00:00Z",
  "dateTo": "2025-11-10T23:59:59Z",
  "includeSections": ["overview", "funnel", "materials", "recommendations"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.example.com/analytics-report.pdf",
    "expiresAt": "2025-11-11T10:00:00Z",
    "format": "pdf",
    "fileSize": 567890
  }
}
```

---

## User Preferences API

### 1. Get User Preferences
**Endpoint:** `GET /api/user-preferences`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "p07f1f77bcf86cd799439011",
    "userId": "user123",
    "savedSearches": [
      {
        "id": "search1",
        "name": "Senior Frontend Jobs",
        "criteria": {
          "keywords": ["React", "Frontend"],
          "location": "San Francisco",
          "salaryMin": 120000
        },
        "notificationsEnabled": true
      }
    ],
    "defaultResumeTemplate": "modern-professional",
    "defaultCoverLetterTemplate": "professional-standard",
    "autoArchiveSettings": {
      "enabled": true,
      "daysAfterRejection": 30,
      "daysAfterInactive": 90
    },
    "matchScoreWeighting": {
      "skills": 0.4,
      "experience": 0.3,
      "education": 0.15,
      "certifications": 0.15
    },
    "notificationPreferences": {
      "email": {
        "enabled": true,
        "deadlineReminders": true,
        "statusUpdates": true,
        "weeklyDigest": true
      },
      "inApp": {
        "enabled": true,
        "deadlineReminders": true,
        "statusUpdates": true
      }
    },
    "jobSearchGoals": {
      "targetRole": "Senior Software Engineer",
      "targetIndustries": ["Technology", "Finance"],
      "targetLocations": ["San Francisco", "Remote"],
      "salaryExpectation": {
        "min": 150000,
        "max": 200000,
        "currency": "USD"
      },
      "weeklyApplicationTarget": 5,
      "desiredStartDate": "2026-01-01"
    },
    "dashboardLayout": {
      "widgets": [
        { "id": "upcoming-deadlines", "position": 1, "enabled": true },
        { "id": "application-funnel", "position": 2, "enabled": true },
        { "id": "job-matches", "position": 3, "enabled": true }
      ]
    },
    "exportDefaults": {
      "resumeFormat": "pdf",
      "coverLetterFormat": "pdf",
      "includeWatermark": false
    },
    "privacySettings": {
      "profileVisibility": "private",
      "shareAnonymousAnalytics": true
    }
  }
}
```

### 2. Update User Preferences
**Endpoint:** `PUT /api/user-preferences`

**Request Body:** (All fields optional)
```json
{
  "defaultResumeTemplate": "minimalist",
  "notificationPreferences": {
    "email": {
      "weeklyDigest": false
    }
  },
  "jobSearchGoals": {
    "weeklyApplicationTarget": 10
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    // ... updated preferences
  }
}
```

### 3. Add Saved Search
**Endpoint:** `POST /api/user-preferences/saved-searches`

**Request Body:**
```json
{
  "name": "Remote React Jobs",
  "criteria": {
    "keywords": ["React", "Remote"],
    "salaryMin": 100000
  },
  "notificationsEnabled": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "search2",
    "name": "Remote React Jobs",
    "criteria": {
      "keywords": ["React", "Remote"],
      "salaryMin": 100000
    },
    "notificationsEnabled": true,
    "createdAt": "2025-11-10T10:00:00Z"
  }
}
```

### 4. Delete Saved Search
**Endpoint:** `DELETE /api/user-preferences/saved-searches/:searchId`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Saved search deleted successfully"
}
```

---

## MongoDB Schemas

### Jobs Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  
  // Basic Job Information
  "title": String (required),
  "company": String (required),
  "location": String,
  "locationType": String (enum: ["onsite", "remote", "hybrid"]),
  "salaryMin": Number,
  "salaryMax": Number,
  "salaryFrequency": String (enum: ["hourly", "monthly", "yearly"]),
  "currency": String (default: "USD"),
  
  // Job Posting Details
  "jobPostingUrl": String,
  "applicationDeadline": Date,
  "description": String (max: 5000),
  "requirements": [String],
  "responsibilities": [String],
  "benefits": [String],
  "industry": String,
  "jobType": String (enum: ["full-time", "part-time", "contract", "internship"]),
  "experienceLevel": String (enum: ["entry", "mid", "senior", "lead", "executive"]),
  
  // Status Tracking
  "status": String (enum: ["interested", "applied", "phone_screen", "interview", "offer", "rejected", "archived"], default: "interested"),
  "statusHistory": [{
    "status": String,
    "timestamp": Date,
    "notes": String
  }],
  
  // Notes and Contacts
  "notes": String,
  "contacts": [{
    "name": String,
    "role": String,
    "email": String,
    "phone": String,
    "linkedIn": String,
    "notes": String
  }],
  
  // Application History
  "applicationHistory": [{
    "date": Date,
    "method": String,
    "status": String,
    "notes": String
  }],
  
  // Import Metadata (UC-041)
  "importMetadata": {
    "source": String,
    "importedAt": Date,
    "originalUrl": String,
    "extractedFields": [String]
  },
  
  // Application Materials (UC-042)
  "linkedResumeId": ObjectId (ref: Resumes),
  "linkedCoverLetterId": ObjectId (ref: CoverLetters),
  
  // Company Reference
  "companyId": ObjectId (ref: CompanyResearch),
  
  // Deadline Tracking
  "deadlineReminders": [{
    "date": Date,
    "sent": Boolean,
    "type": String
  }],
  
  // Archiving
  "isArchived": Boolean (default: false),
  "archivedAt": Date,
  "archiveReason": String,
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.jobs.createIndex({ userId: 1, status: 1 })
db.jobs.createIndex({ userId: 1, applicationDeadline: 1 })
db.jobs.createIndex({ userId: 1, company: 1 })
db.jobs.createIndex({ userId: 1, isArchived: 1 })
db.jobs.createIndex({ userId: 1, createdAt: -1 })
```

### Resumes Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  
  // Basic Info
  "title": String (required),
  "version": Number (default: 1),
  "isDefault": Boolean (default: false),
  "templateId": String,
  
  // Contact Information
  "contactInfo": {
    "fullName": String,
    "email": String,
    "phone": String,
    "location": String,
    "website": String,
    "linkedIn": String,
    "github": String,
    "portfolio": String
  },
  
  // Resume Content
  "summary": String (max: 1000),
  "experience": [{
    "company": String,
    "title": String,
    "location": String,
    "startDate": Date,
    "endDate": Date,
    "isCurrent": Boolean,
    "description": String,
    "achievements": [String],
    "technologies": [String]
  }],
  "skills": {
    "technical": [{
      "name": String,
      "proficiency": String (enum: ["beginner", "intermediate", "advanced", "expert"]),
      "yearsOfExperience": Number
    }],
    "soft": [String],
    "languages": [{
      "name": String,
      "proficiency": String
    }]
  },
  "education": [{
    "institution": String,
    "degree": String,
    "field": String,
    "location": String,
    "graduationDate": Date,
    "gpa": Number,
    "honors": [String],
    "relevantCoursework": [String]
  }],
  "projects": [{
    "name": String,
    "description": String,
    "technologies": [String],
    "url": String,
    "githubUrl": String,
    "startDate": Date,
    "endDate": Date,
    "highlights": [String]
  }],
  "certifications": [{
    "name": String,
    "issuer": String,
    "issueDate": Date,
    "expiryDate": Date,
    "credentialId": String,
    "url": String
  }],
  
  // AI Metadata (UC-047)
  "aiMetadata": {
    "isAIGenerated": Boolean,
    "generatedAt": Date,
    "model": String,
    "prompt": String,
    "baseResumeId": ObjectId,
    "jobId": ObjectId,
    "focusAreas": [String],
    "optimizationsApplied": [String]
  },
  
  // Validation (UC-053)
  "validationStatus": {
    "isValid": Boolean,
    "lastChecked": Date,
    "issues": [{
      "severity": String,
      "category": String,
      "message": String
    }]
  },
  
  // Version Management (UC-052)
  "versionHistory": [{
    "version": Number,
    "createdAt": Date,
    "changes": String
  }],
  "parentResumeId": ObjectId,
  
  // Sections Configuration (UC-048)
  "sectionsEnabled": {
    "summary": Boolean,
    "experience": Boolean,
    "skills": Boolean,
    "education": Boolean,
    "projects": Boolean,
    "certifications": Boolean
  },
  "sectionsOrder": [String],
  
  // Export Settings (UC-051)
  "exportSettings": {
    "lastExportFormat": String,
    "lastExportDate": Date
  },
  
  // Collaboration (UC-054)
  "shareableLink": {
    "token": String,
    "expiresAt": Date,
    "allowComments": Boolean,
    "allowEditing": Boolean
  },
  
  // Usage Tracking
  "usageCount": Number (default: 0),
  "linkedApplications": [ObjectId] (ref: Jobs),
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.resumes.createIndex({ userId: 1, isDefault: 1 })
db.resumes.createIndex({ userId: 1, createdAt: -1 })
db.resumes.createIndex({ "shareableLink.token": 1 }, { sparse: true })
```

### Cover Letters Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "jobId": ObjectId (ref: Jobs),
  
  // Basic Info
  "title": String (required),
  "version": Number (default: 1),
  "templateId": String,
  
  // Recipient Information
  "recipientInfo": {
    "name": String,
    "title": String,
    "company": String,
    "address": String,
    "email": String
  },
  
  // Content
  "content": {
    "opening": String,
    "introduction": String,
    "body": [String],
    "closing": String,
    "signature": String
  },
  
  // AI Metadata (UC-056)
  "aiMetadata": {
    "isAIGenerated": Boolean,
    "generatedAt": Date,
    "model": String,
    "prompt": String,
    "resumeId": ObjectId,
    "companyResearchUsed": Boolean,
    "companyResearchSummary": String
  },
  
  // Company Research Integration (UC-057)
  "companyResearchIntegration": {
    "companyId": ObjectId (ref: CompanyResearch),
    "newsReferences": [{
      "newsId": String,
      "title": String,
      "integratedIn": String,
      "context": String
    }],
    "missionAlignment": String,
    "cultureMatch": String
  },
  
  // Tone and Style (UC-058)
  "tone": String (enum: ["formal", "casual", "enthusiastic", "analytical"]),
  "style": String (enum: ["narrative", "bullet_points", "hybrid"]),
  "customToneInstructions": String,
  
  // Experience Highlighting (UC-059)
  "highlightedExperiences": [{
    "experienceId": String,
    "relevanceScore": Number,
    "emphasis": String
  }],
  
  // Editing History (UC-060)
  "editHistory": [{
    "timestamp": Date,
    "changes": [String],
    "editor": String
  }],
  
  // Validation
  "validationStatus": {
    "isValid": Boolean,
    "lastChecked": Date,
    "issues": [{
      "severity": String,
      "message": String
    }]
  },
  
  // Export Settings (UC-061)
  "exportSettings": {
    "lastExportFormat": String,
    "lastExportDate": Date,
    "includeLetterhead": Boolean
  },
  
  // Performance Tracking (UC-062)
  "performanceTracking": {
    "linkedApplications": [ObjectId],
    "responseRate": Number,
    "successRate": Number
  },
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.coverLetters.createIndex({ userId: 1, jobId: 1 })
db.coverLetters.createIndex({ userId: 1, createdAt: -1 })
```

### Company Research Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "companyName": String (required, unique per user),
  
  // Basic Information (UC-063)
  "basicInfo": {
    "website": String,
    "industry": String,
    "headquarters": String,
    "founded": Number,
    "size": String,
    "type": String (enum: ["public", "private", "nonprofit"])
  },
  
  // Company Profile
  "profile": {
    "mission": String,
    "vision": String,
    "values": [String],
    "culture": String,
    "products": [String],
    "services": [String]
  },
  
  // Leadership (UC-063)
  "leadership": [{
    "name": String,
    "title": String,
    "bio": String,
    "linkedIn": String,
    "twitter": String,
    "background": String
  }],
  
  // News and Updates (UC-064)
  "news": [{
    "title": String,
    "source": String,
    "date": Date,
    "url": String,
    "summary": String,
    "category": String (enum: ["funding", "product", "hiring", "leadership", "acquisition", "partnership", "other"]),
    "sentiment": String (enum: ["positive", "neutral", "negative"]),
    "relevanceScore": Number,
    "keyPoints": [String]
  }],
  
  // Social Media Presence
  "socialMedia": {
    "linkedIn": String,
    "twitter": String,
    "facebook": String,
    "instagram": String,
    "youtube": String,
    "github": String
  },
  
  // Ratings and Reviews
  "ratings": {
    "glassdoor": {
      "overall": Number,
      "culture": Number,
      "workLife": Number,
      "benefits": Number,
      "url": String,
      "reviewCount": Number
    },
    "indeed": {
      "overall": Number,
      "url": String
    }
  },
  
  // Financial Information
  "financials": {
    "revenue": String,
    "fundingRounds": [{
      "round": String,
      "amount": Number,
      "date": Date,
      "investors": [String]
    }],
    "valuation": Number,
    "stockSymbol": String
  },
  
  // Competitive Landscape
  "competitiveLandscape": {
    "mainCompetitors": [String],
    "marketPosition": String,
    "differentiators": [String]
  },
  
  // Research Summary
  "researchSummary": {
    "strengths": [String],
    "concerns": [String],
    "opportunities": [String],
    "interviewTips": [String],
    "applicationAdvice": [String]
  },
  
  // Metadata
  "lastResearchedAt": Date,
  "researchedBy": String (enum: ["manual", "automated"]),
  "dataQuality": Number,
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.companyResearch.createIndex({ userId: 1, companyName: 1 }, { unique: true })
db.companyResearch.createIndex({ userId: 1, "news.date": -1 })
```

### Job Match Scores Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "jobId": ObjectId (ref: Jobs, unique per user),
  
  // Overall Score (UC-065)
  "overallScore": Number (0-1),
  
  // Category Scores
  "categoryScores": {
    "skills": {
      "score": Number,
      "weight": Number,
      "details": {
        "requiredSkillsMatch": Number,
        "preferredSkillsMatch": Number,
        "matchedSkills": [String],
        "missingSkills": [String]
      }
    },
    "experience": {
      "score": Number,
      "weight": Number,
      "details": {
        "yearsRequired": Number,
        "yearsHave": Number,
        "relevantExperience": Number,
        "industryMatch": Boolean
      }
    },
    "education": {
      "score": Number,
      "weight": Number,
      "details": {
        "degreeMatch": Boolean,
        "fieldMatch": Boolean,
        "institutionPrestige": Number
      }
    },
    "certifications": {
      "score": Number,
      "weight": Number,
      "details": {
        "requiredCertifications": [String],
        "haveCertifications": [String],
        "relevantCertifications": Number
      }
    }
  },
  
  // Strengths and Gaps
  "strengths": [String],
  "gaps": [{
    "category": String,
    "item": String,
    "importance": String (enum: ["low", "medium", "high"]),
    "impact": Number
  }],
  
  // Skills Gap Details (UC-066)
  "skillsGapAnalysis": {
    "overallGap": Number,
    "detailedGaps": [{
      "skill": String,
      "currentLevel": String,
      "requiredLevel": String,
      "gap": Number,
      "priority": String,
      "estimatedLearningTime": String
    }],
    "learningPathId": ObjectId (ref: LearningResources)
  },
  
  // Profile Improvement Suggestions
  "improvementSuggestions": [{
    "category": String,
    "suggestion": String,
    "impact": Number,
    "effort": String (enum: ["low", "medium", "high"])
  }],
  
  // Recommendations
  "recommendations": [String],
  
  // Score History
  "scoreHistory": [{
    "date": Date,
    "score": Number,
    "changes": [String]
  }],
  
  "calculatedAt": Date,
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.jobMatchScores.createIndex({ userId: 1, jobId: 1 }, { unique: true })
db.jobMatchScores.createIndex({ userId: 1, overallScore: -1 })
```

### Learning Resources Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "targetJobId": ObjectId (ref: Jobs),
  
  // Learning Path (UC-066)
  "learningPath": [{
    "phase": Number,
    "skills": [String],
    "duration": String,
    "goal": String,
    "completed": Boolean
  }],
  
  // Skills to Learn
  "skillsToLearn": [{
    "skill": String,
    "currentLevel": String,
    "targetLevel": String,
    "priority": String,
    "estimatedTime": String
  }],
  
  // Resources
  "resources": [{
    "skill": String,
    "title": String,
    "type": String (enum: ["course", "tutorial", "book", "documentation", "video", "article"]),
    "provider": String,
    "duration": String,
    "price": Number,
    "currency": String,
    "url": String,
    "rating": Number,
    "difficulty": String,
    "completionStatus": {
      "started": Boolean,
      "progress": Number,
      "completed": Boolean,
      "completedAt": Date
    }
  }],
  
  // Platform Integrations
  "platformIntegrations": [{
    "platform": String,
    "accountLinked": Boolean,
    "syncEnabled": Boolean,
    "lastSync": Date
  }],
  
  // Progress Tracking
  "overallProgress": Number,
  "skillsCompleted": [String],
  "skillsInProgress": [String],
  
  // Trends and Insights
  "skillTrends": [{
    "skill": String,
    "demandTrend": String (enum: ["rising", "stable", "declining"]),
    "marketDemand": Number
  }],
  
  // Milestones
  "milestones": [{
    "title": String,
    "description": String,
    "targetDate": Date,
    "achieved": Boolean,
    "achievedAt": Date
  }],
  
  // Recommendations
  "recommendations": [String],
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.learningResources.createIndex({ userId: 1, targetJobId: 1 })
db.learningResources.createIndex({ userId: 1, createdAt: -1 })
```

### Interview Preparation Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "jobId": ObjectId (ref: Jobs),
  "companyId": ObjectId (ref: CompanyResearch),
  
  // Interview Process (UC-068)
  "interviewProcess": {
    "stages": [{
      "name": String,
      "duration": String,
      "format": String (enum: ["phone", "video", "in-person", "assessment"]),
      "description": String
    }],
    "typicalDuration": String,
    "decisionTimeline": String
  },
  
  // Common Questions
  "commonQuestions": [{
    "question": String,
    "category": String (enum: ["behavioral", "technical", "situational", "cultural"]),
    "difficulty": String (enum: ["easy", "medium", "hard"]),
    "suggestedAnswer": String,
    "keyPoints": [String]
  }],
  
  // Interviewers
  "interviewers": [{
    "name": String,
    "title": String,
    "linkedIn": String,
    "twitter": String,
    "background": String,
    "interviewFocus": String,
    "notes": String
  }],
  
  // Company-Specific Format
  "companySpecificFormat": {
    "hasWhiteboardCoding": Boolean,
    "hasTakeHomeAssignment": Boolean,
    "hasSystemDesign": Boolean,
    "hasBehavioralRound": Boolean,
    "hasCaseStudy": Boolean,
    "uniqueAspects": [String]
  },
  
  // Preparation Recommendations
  "preparationRecommendations": [String],
  "successTips": [String],
  
  // Checklist
  "checklist": [{
    "category": String,
    "items": [{
      "task": String,
      "completed": Boolean,
      "completedAt": Date
    }]
  }],
  
  // Scheduled Interviews (UC-071)
  "scheduledInterviews": [{
    "type": String,
    "scheduledDate": Date,
    "duration": Number,
    "format": String,
    "location": String,
    "meetingLink": String,
    "interviewers": [String],
    "notes": String,
    "calendarIntegration": {
      "eventId": String,
      "provider": String,
      "synced": Boolean
    },
    "reminders": [{
      "type": String,
      "time": Date,
      "sent": Boolean
    }],
    "outcome": {
      "result": String (enum: ["passed", "failed", "pending"]),
      "feedback": String,
      "nextSteps": String,
      "completedAt": Date
    }
  }],
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.interviewPreparation.createIndex({ userId: 1, jobId: 1 })
db.interviewPreparation.createIndex({ userId: 1, "scheduledInterviews.scheduledDate": 1 })
```

### Application Materials Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users),
  "jobId": ObjectId (ref: Jobs, unique per user),
  
  // Resume Used (UC-042)
  "resumeUsed": {
    "resumeId": ObjectId (ref: Resumes),
    "version": Number,
    "title": String,
    "linkedAt": Date,
    "downloadUrl": String
  },
  
  // Cover Letter Used
  "coverLetterUsed": {
    "coverLetterId": ObjectId (ref: CoverLetters),
    "version": Number,
    "title": String,
    "linkedAt": Date,
    "downloadUrl": String
  },
  
  // Portfolio
  "portfolioUrl": String,
  
  // Additional Documents
  "additionalDocuments": [{
    "name": String,
    "url": String,
    "type": String,
    "uploadedAt": Date
  }],
  
  // Update History
  "updateHistory": [{
    "timestamp": Date,
    "changes": [String],
    "updatedBy": String
  }],
  
  // Version Comparison
  "versionComparisons": [{
    "comparisonDate": Date,
    "resumeVersion": Number,
    "coverLetterVersion": Number,
    "notes": String
  }],
  
  // Access Log
  "accessLog": [{
    "timestamp": Date,
    "action": String,
    "documentType": String
  }],
  
  // Analytics
  "analytics": {
    "tailoringLevel": Number,
    "optimizationScore": Number,
    "lastOptimized": Date
  },
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.applicationMaterials.createIndex({ userId: 1, jobId: 1 }, { unique: true })
```

### User Preferences Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users, unique),
  
  // Saved Searches
  "savedSearches": [{
    "id": String,
    "name": String,
    "criteria": {
      "keywords": [String],
      "location": String,
      "salaryMin": Number,
      "salaryMax": Number,
      "industry": String,
      "jobType": String
    },
    "notificationsEnabled": Boolean,
    "createdAt": Date
  }],
  
  // Default Templates (UC-046, UC-055)
  "defaultResumeTemplate": String,
  "defaultCoverLetterTemplate": String,
  
  // Auto-Archive Settings (UC-045)
  "autoArchiveSettings": {
    "enabled": Boolean,
    "daysAfterRejection": Number,
    "daysAfterInactive": Number,
    "archiveCompleted": Boolean
  },
  
  // Match Score Weighting
  "matchScoreWeighting": {
    "skills": Number,
    "experience": Number,
    "education": Number,
    "certifications": Number
  },
  
  // Notification Preferences
  "notificationPreferences": {
    "email": {
      "enabled": Boolean,
      "deadlineReminders": Boolean,
      "statusUpdates": Boolean,
      "weeklyDigest": Boolean,
      "newMatchAlerts": Boolean
    },
    "inApp": {
      "enabled": Boolean,
      "deadlineReminders": Boolean,
      "statusUpdates": Boolean,
      "newMatchAlerts": Boolean
    }
  },
  
  // Job Search Goals
  "jobSearchGoals": {
    "targetRole": String,
    "targetIndustries": [String],
    "targetLocations": [String],
    "salaryExpectation": {
      "min": Number,
      "max": Number,
      "currency": String
    },
    "weeklyApplicationTarget": Number,
    "desiredStartDate": Date
  },
  
  // Dashboard Configuration
  "dashboardLayout": {
    "widgets": [{
      "id": String,
      "position": Number,
      "enabled": Boolean
    }]
  },
  
  // Export Defaults (UC-051, UC-061)
  "exportDefaults": {
    "resumeFormat": String,
    "coverLetterFormat": String,
    "includeWatermark": Boolean,
    "theme": String
  },
  
  // Privacy Settings
  "privacySettings": {
    "profileVisibility": String (enum: ["public", "private"]),
    "shareAnonymousAnalytics": Boolean
  },
  
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.userPreferences.createIndex({ userId: 1 }, { unique: true })
```

### Analytics Collection Schema
```javascript
{
  "_id": ObjectId,
  "userId": String (ref: Users, unique),
  
  // Job Statistics (UC-072)
  "jobStatistics": {
    "totalJobsTracked": Number,
    "activeJobs": Number,
    "archivedJobs": Number,
    "byStatus": {
      "interested": Number,
      "applied": Number,
      "phone_screen": Number,
      "interview": Number,
      "offer": Number,
      "rejected": Number
    },
    "byIndustry": {},
    "averageSalaryRange": {
      "min": Number,
      "max": Number,
      "currency": String
    }
  },
  
  // Application Pipeline (UC-072)
  "applicationPipeline": {
    "conversionRates": {
      "applied_to_phone_screen": Number,
      "phone_screen_to_interview": Number,
      "interview_to_offer": Number
    },
    "averageTimeInStage": {},
    "totalApplications": Number,
    "successRate": Number,
    "averageResponseTime": Number
  },
  
  // Time to Hire
  "timeToHire": {
    "average": Number,
    "fastest": Number,
    "slowest": Number,
    "byIndustry": {}
  },
  
  // Activity Trends
  "activityTrends": {
    "applicationsPerWeek": [{
      "week": String,
      "count": Number
    }],
    "interviewsPerWeek": [{
      "week": String,
      "count": Number
    }]
  },
  
  // Material Effectiveness
  "materialEffectiveness": {
    "resumeUsage": {
      "mostSuccessful": {
        "resumeId": ObjectId,
        "title": String,
        "successRate": Number
      },
      "leastSuccessful": {
        "resumeId": ObjectId,
        "title": String,
        "successRate": Number
      }
    },
    "coverLetterUsage": {
      "mostSuccessful": {
        "coverLetterId": ObjectId,
        "title": String,
        "successRate": Number
      }
    }
  },
  
  // Benchmarking
  "benchmarking": {
    "industryAverages": {
      "responseRate": Number,
      "interviewRate": Number,
      "offerRate": Number
    },
    "yourPerformance": {
      "responseRate": Number,
      "interviewRate": Number,
      "offerRate": Number
    },
    "comparison": {}
  },
  
  // Recommendations
  "recommendations": [String],
  
  // Goals
  "goals": {
    "weeklyApplications": {
      "target": Number,
      "current": Number,
      "progress": Number
    },
    "targetOffers": {
      "target": Number,
      "current": Number,
      "progress": Number
    }
  },
  
  // Export History
  "exportHistory": [{
    "exportDate": Date,
    "reportType": String,
    "format": String
  }],
  
  "generatedAt": Date,
  "createdAt": Date,
  "updatedAt": Date
}

// Indexes
db.analytics.createIndex({ userId: 1 }, { unique: true })
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Invalid request data",
    "fields": ["email", "password"]
  }
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes and Messages

#### Authentication Errors
- `AUTH_001`: "Invalid credentials"
- `AUTH_002`: "Token expired"
- `AUTH_003`: "Invalid token"
- `AUTH_004`: "Account not found"

#### Validation Errors
- `VAL_001`: "Required field missing"
- `VAL_002`: "Invalid field format"
- `VAL_003`: "Field value out of range"
- `VAL_004`: "Duplicate entry"

#### Resource Errors
- `RES_001`: "Resource not found"
- `RES_002`: "Resource already exists"
- `RES_003`: "Cannot delete resource with dependencies"

#### AI Service Errors
- `AI_001`: "AI service unavailable"
- `AI_002`: "AI generation failed"
- `AI_003`: "AI rate limit exceeded"

#### Import Errors
- `IMP_001`: "URL not accessible"
- `IMP_002`: "Unable to parse job posting"
- `IMP_003`: "Unsupported job board"

---

## API Implementation Notes

### Authentication
- All endpoints except login/register require JWT authentication
- Token should be passed in Authorization header: `Bearer <token>`
- Tokens expire after 7 days
- Refresh tokens not implemented in Sprint 2

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Page numbers start at 1
- Always include pagination metadata in responses

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user
- AI generation endpoints: 10 requests per minute

### Data Validation
- All required fields must be validated
- String fields should be trimmed
- Dates should be in ISO 8601 format
- Currency codes should follow ISO 4217

### AI Integration
- Use OpenAI GPT-4 for content generation
- Implement retry logic for AI failures
- Cache AI responses when appropriate
- Include AI metadata in responses
- Always provide fallback options

### File Storage
- Store exported resumes/cover letters in cloud storage (S3, GCS)
- Generate presigned URLs with 24-hour expiration
- Support PDF, DOCX, TXT formats
- Maximum file size: 10MB

### Database Operations
- Use MongoDB transactions for multi-document operations
- Implement soft deletes for critical data
- Index frequently queried fields
- Use aggregation pipelines for analytics

### Performance Considerations
- Cache company research data (24-hour TTL)
- Implement request debouncing for search/filter
- Use database indexes for common queries
- Paginate large result sets
- Implement lazy loading for related data

### Security
- Sanitize all user inputs
- Validate file uploads
- Implement CORS properly
- Use parameterized queries
- Hash sensitive data
- Implement rate limiting
- Log security events

### Testing Requirements (UC-073)
- Unit tests for all API endpoints
- Integration tests for AI services
- Mock external API calls in tests
- Test error handling scenarios
- Test authentication/authorization
- Minimum 90% code coverage
- Load testing for high-traffic endpoints

---

## Implementation Priority

### Phase 1: Core Job Management (Weeks 5-6)
1. Jobs CRUD API
2. Job status management
3. Job search and filtering
4. Job statistics

### Phase 2: AI Content Generation (Weeks 6-7)
1. Resume CRUD and AI generation
2. Cover letter CRUD and AI generation
3. Company research automation
4. Job matching algorithm

### Phase 3: Advanced Features (Week 7)
1. Application materials tracking
2. Interview preparation
3. Skills gap analysis
4. Learning resources

### Phase 4: Analytics and Polish (Week 8)
1. Analytics dashboard
2. User preferences
3. Performance optimization
4. Comprehensive testing

---

## Next Steps

1. **Review and Approve**: Have backend team review this specification
2. **Environment Setup**: Configure MongoDB, OpenAI API keys, cloud storage
3. **API Development**: Implement endpoints following this specification
4. **Frontend Integration**: Update `src/lib/api.ts` with new endpoints
5. **Testing**: Implement unit and integration tests
6. **Documentation**: Keep this spec updated as implementation proceeds
7. **Deployment**: Deploy to staging environment for frontend integration

---

## Questions or Clarifications?

Contact the project lead for any questions about:
- API endpoint specifications
- Data model relationships
- AI integration requirements
- Testing requirements
- Performance expectations
