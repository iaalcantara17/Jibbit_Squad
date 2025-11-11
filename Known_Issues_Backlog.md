# Known Issues & Backlog

**Sprint**: Sprint 2  
**Date**: 2025-11-11  
**Status**: 22/38 UCs Complete | 10 Partial | 6 Backlog

This document tracks known issues, incomplete features, and technical debt from Sprint 2.

---

## ❌ Not Implemented (Backlog)

### Issue #1: UC-043 - Company Info Display
**Severity**: Medium  
**Status**: Backlog  

**Description**: Company profile pane in Job Details showing comprehensive company information.

**Acceptance Criteria**:
- [ ] Display company size (employees)
- [ ] Display industry classification
- [ ] Display headquarters location
- [ ] Display company logo (if available)
- [ ] Display Glassdoor rating (if available)
- [ ] Display company website link
- [ ] Fetch data from company research API
- [ ] Cache company data to avoid re-fetching
- [ ] Fallback UI for missing data

**Estimated Effort**: 8-12 hours

---

### Issue #2: UC-045 - Job Archiving & Management
**Severity**: Medium  
**Status**: Backlog  

**Description**: Complete archive/restore functionality with auto-archive rules.

**Acceptance Criteria**:
- [ ] Archive view showing all archived jobs
- [ ] Restore archived jobs back to active
- [ ] Bulk archive action (select multiple jobs)
- [ ] Auto-archive rules based on conditions:
  - [ ] Status = "Rejected" + 30 days old
  - [ ] Status = "Applied" + 90 days no response
  - [ ] User-defined custom rules
- [ ] Archive reasons (declined, no response, duplicate, etc.)
- [ ] Undo archive within 24 hours
- [ ] Soft delete (keep data, mark is_archived=true)

**Estimated Effort**: 16-24 hours

---

### Issue #3: UC-055 - CL Template Library
**Severity**: Low  
**Status**: Backlog  

**Description**: Template library for cover letters with CRUD, categorization, and preview.

**Acceptance Criteria**:
- [ ] Create custom templates (name, body, placeholders)
- [ ] Edit existing templates
- [ ] Delete templates (with confirmation)
- [ ] Categorize templates (formal, creative, technical, etc.)
- [ ] Preview template before use
- [ ] Set default template
- [ ] Import templates from file (.txt, .md)
- [ ] Export templates to file

**Estimated Effort**: 12-16 hours

---

### Issue #4: UC-058 - CL Tone & Style
**Severity**: Low  
**Status**: Backlog  

**Description**: Tone and style presets for cover letter generation.

**Acceptance Criteria**:
- [ ] Tone presets:
  - [ ] Formal/Traditional
  - [ ] Casual/Friendly
  - [ ] Enthusiastic/Passionate
  - [ ] Concise/Direct
- [ ] Style presets:
  - [ ] Storytelling (narrative approach)
  - [ ] Achievement-focused (metrics-driven)
  - [ ] Skills-focused (technical emphasis)
- [ ] Preview tone before generation
- [ ] Apply tone to existing CL (regenerate)
- [ ] Mix tone + style combinations

**Estimated Effort**: 8-12 hours

---

### Issue #5: UC-059 - CL Experience Highlighting
**Severity**: Low  
**Status**: Backlog  

**Description**: Automatically highlight relevant experience bullets from resume in cover letter.

**Acceptance Criteria**:
- [ ] Analyze job description for key requirements
- [ ] Match requirements to resume experience bullets
- [ ] Score bullets by relevance (0-100)
- [ ] Auto-select top 3-5 bullets for CL
- [ ] Allow manual selection/deselection
- [ ] Rephrase bullets for CL context (AI)
- [ ] Highlight selected bullets in resume preview

**Estimated Effort**: 12-16 hours

---

### Issue #6: UC-065 - Job Matching Algorithm
**Severity**: Medium  
**Status**: Backlog  

**Description**: Advanced multi-factor job matching with learning.

**Acceptance Criteria**:
- [ ] Multi-factor scoring:
  - [ ] Skills match (weighted by importance)
  - [ ] Experience level match
  - [ ] Education match
  - [ ] Location match
  - [ ] Salary range match
- [ ] Learning user preferences:
  - [ ] Track which jobs user applies to
  - [ ] Adjust weights based on patterns
  - [ ] Suggest similar jobs
- [ ] Match score visualization (breakdown by factor)
- [ ] Filter jobs by min match score
- [ ] Sort jobs by match score

**Estimated Effort**: 20-30 hours

---

## ⚠️ Partially Implemented

### Issue #7: UC-047 - AI Resume Content Generation (UI Incomplete)
**Severity**: Medium  
**Status**: Partial (Backend ✅, UI Basic)  

**Description**: Backend AI resume generation works, but UI lacks polish and advanced features.

**Completed**:
- ✅ Backend edge function (`ai-resume-generate`)
- ✅ Generate from profile data
- ✅ Basic UI in `ResumeBuilder.tsx`

**Missing**:
- [ ] Loading states with progress indicators
- [ ] Error handling with retry
- [ ] Generate specific sections (not full resume)
- [ ] Preview before apply
- [ ] Undo generated content
- [ ] Regenerate specific sections

**Estimated Effort**: 8-12 hours

---

### Issue #8: UC-048 - Resume Section Customization (Advanced Features)
**Severity**: Low  
**Status**: Partial (Basic Editor ✅)  

**Description**: Basic section editor exists, but advanced customization is missing.

**Completed**:
- ✅ `ResumeSectionEditor.tsx`
- ✅ Edit section title and content
- ✅ Reorder sections (drag-drop)

**Missing**:
- [ ] Section templates (pre-built formats)
- [ ] Custom section types (beyond standard experience/education/skills)
- [ ] Section-specific formatting (columns, bullet styles, etc.)
- [ ] Section visibility toggle (show/hide)
- [ ] Section duplication

**Estimated Effort**: 12-16 hours

---

### Issue #9: UC-051 - Resume Export (Tests Incomplete)
**Severity**: Medium  
**Status**: Partial (Export Works ✅, Tests Partial)  

**Description**: PDF/DOCX export works, but test coverage is low.

**Completed**:
- ✅ PDF export (`jspdf`)
- ✅ DOCX export (`docx`)
- ✅ `.eml` export for cover letters

**Missing**:
- [ ] Unit tests for export functions
- [ ] Integration tests for formatting preservation
- [ ] Edge case tests (empty sections, long content, special characters)
- [ ] Test .eml export with various email clients

**Estimated Effort**: 6-8 hours

---

### Issue #10: UC-052 - Resume Version Management (Diff UI)
**Severity**: Low  
**Status**: Partial (Compare Works ✅, Diff UI Partial)  

**Description**: Version comparison works, but diff visualization is basic.

**Completed**:
- ✅ `ResumeVersionManager.tsx`
- ✅ `MaterialsVersionCompare.tsx`
- ✅ Side-by-side comparison

**Missing**:
- [ ] Inline diff view (GitHub-style)
- [ ] Highlight changed sections (color-coded)
- [ ] Restore specific sections from old version
- [ ] Merge versions (pick sections from each)
- [ ] Version notes/comments

**Estimated Effort**: 8-12 hours

---

### Issue #11: UC-053 - Resume Validation (UI Integration)
**Severity**: Medium  
**Status**: Partial (Validation ✅, UI Integration Partial)  

**Description**: Validation logic works, but UI integration is basic.

**Completed**:
- ✅ `ResumeValidator.tsx`
- ✅ `validationService.ts`
- ✅ `ResumeValidation.test.tsx`
- ✅ Spelling, grammar, readability, length, tone checks

**Missing**:
- [ ] Real-time validation as user types
- [ ] Inline error highlights in resume editor
- [ ] Quick-fix suggestions (click to apply)
- [ ] Validation report export (PDF/CSV)
- [ ] Customizable validation rules

**Estimated Effort**: 8-12 hours

---

### Issue #12: UC-056 - AI Cover Letter Generation (Advanced Features)
**Severity**: Medium  
**Status**: Partial (Basic Generation ✅)  

**Description**: Basic CL generation works, but advanced features are missing.

**Completed**:
- ✅ `CoverLetterGenerator.tsx`
- ✅ `ai-cover-letter-generate/index.ts`
- ✅ Template-based generation
- ✅ Job-specific content

**Missing**:
- [ ] Multi-version generation (A/B testing)
- [ ] Persona-based generation (different voices)
- [ ] Include portfolio links/attachments
- [ ] Generate for multiple jobs at once (batch)
- [ ] Custom instructions field

**Estimated Effort**: 12-16 hours

---

### Issue #13: UC-060 - CL Editing & Refinement (Refinement Loops)
**Severity**: Low  
**Status**: Partial (Basic Editor ✅)  

**Description**: Basic editor works, but AI-powered refinement loops are missing.

**Completed**:
- ✅ `CoverLetterEditor.tsx`
- ✅ Basic text editing
- ✅ Grammar check via `ai-grammar-check`

**Missing**:
- [ ] AI refinement suggestions (improve paragraph)
- [ ] Tone adjustment (make more formal/casual)
- [ ] Simplify complex sentences
- [ ] Expand on specific points
- [ ] Refinement history (undo chain)

**Estimated Effort**: 12-16 hours

---

### Issue #14: UC-063/064 - Company Research/News (UI Basic)
**Severity**: Medium  
**Status**: Partial (Backend ✅, UI Basic)  

**Description**: Backend AI research works, but UI is basic.

**Completed**:
- ✅ `ai-company-research/index.ts`
- ✅ `ai-company-news/index.ts`
- ✅ `CompanyResearch.tsx` (basic)
- ✅ `CompanyNewsSection.tsx` (basic)

**Missing**:
- [ ] Rich UI for news (cards, images, links)
- [ ] News filtering (date range, keywords)
- [ ] Save news articles for later
- [ ] Compare company research across jobs
- [ ] Export research report (PDF)

**Estimated Effort**: 12-16 hours

---

### Issue #15: UC-067 - Salary Research (Benchmarking)
**Severity**: Low  
**Status**: Partial (Basic Lookup ✅)  

**Description**: Basic salary lookup works, but benchmarking is missing.

**Completed**:
- ✅ `SalaryResearch.tsx`
- ✅ `ai-salary-research/index.ts`
- ✅ Salary range estimate

**Missing**:
- [ ] Benchmark against similar roles
- [ ] Location-based salary adjustment
- [ ] Experience-level salary curve
- [ ] Percentile breakdown (25th, 50th, 75th, 90th)
- [ ] Salary negotiation tips

**Estimated Effort**: 8-12 hours

---

### Issue #16: UC-072 - Analytics Dashboard (Funnel/Heatmaps)
**Severity**: Low  
**Status**: Partial (KPIs ✅)  

**Description**: KPIs work, but advanced visualizations are missing.

**Completed**:
- ✅ `Analytics.tsx`
- ✅ Response rate, time-to-offer, deadline adherence
- ✅ Monthly application chart

**Missing**:
- [ ] Funnel visualization (Interested → Applied → Interview → Offer)
- [ ] Heatmap (application activity by day/time)
- [ ] Geographic map (applications by location)
- [ ] Industry breakdown chart
- [ ] Success rate by company size

**Estimated Effort**: 12-16 hours

---

### Issue #17: UC-073 - Test Coverage (Branches <85%)
**Severity**: High  
**Status**: In Progress (Global ≥55% ✅, Sprint-2 Paths 90% avg, Branches 84.3%)  

**Description**: Global coverage meets target, but some Sprint-2 paths have branches <85%.

**Completed**:
- ✅ Global coverage ≥55%
- ✅ Most Sprint-2 paths ≥90%
- ✅ Handler refactoring + tests (email-poller, calendar-sync, resume-share)

**Missing**:
- [ ] `src/components/automation/**` branches +1% (current 84.0%, target 85%)
- [ ] `src/components/cover-letters/**` branches +1.3% (current 83.7%, target 85%)
- [ ] Add 5-6 negative path tests (error handling, edge cases)

**Acceptance Criteria**:
- [ ] Add test: Automation rule with unsatisfied condition (skipped)
- [ ] Add test: Automation action fails (error outcome logged)
- [ ] Add test: CL generation with missing profile data (error)
- [ ] Add test: CL export with invalid format (error)
- [ ] Add test: Research injector with no news available (empty state)

**Estimated Effort**: 4-6 hours

---

## 🐛 Technical Debt

### Issue #18: Job URL Scraping (Limited Coverage)
**Severity**: Low  
**Status**: Known Limitation  

**Description**: `ai-job-import` partially works, but scraping fails on many sites.

**Current State**:
- Works: LinkedIn, Indeed, Glassdoor (partial)
- Fails: Many company career pages (anti-scraping measures)

**Solution Options**:
- [ ] Improve scraper with headless browser (Puppeteer)
- [ ] Add more site-specific parsers
- [ ] Fallback to AI extraction from plain text (current approach)
- [ ] Consider third-party APIs (RapidAPI, Apify)

**Estimated Effort**: 20-30 hours

---

### Issue #19: Rate Limiting (Public Share Endpoints)
**Severity**: Low  
**Status**: Recommended Enhancement  

**Description**: Public endpoints (resume-share-resolve, resume-share-comment) lack rate limiting.

**Risk**: Abuse by bots, excessive requests from single IP

**Recommendation**:
- [ ] Add rate limiting in edge functions (Deno KV or Upstash)
- [ ] Limit to 100 requests/hour per IP for public endpoints
- [ ] Return 429 Too Many Requests with Retry-After header

**Estimated Effort**: 4-6 hours

---

### Issue #20: Database Indexes (Performance)
**Severity**: Low  
**Status**: Optimization Opportunity  

**Description**: Some tables lack indexes for common queries.

**Tables Needing Indexes**:
- [ ] `jobs`: Composite index on `(user_id, status, application_deadline)`
- [ ] `email_tracking`: Index on `(user_id, received_at DESC)`
- [ ] `application_status_history`: Index on `(job_id, changed_at DESC)`

**Estimated Effort**: 2-3 hours

---

### Issue #21: OAuth Integration Tests
**Severity**: Medium  
**Status**: Missing  

**Description**: Gmail and Calendar OAuth flows lack integration tests.

**Missing Tests**:
- [ ] Gmail OAuth: Full flow (start → callback → token storage)
- [ ] Calendar OAuth: Full flow (start → callback → token storage)
- [ ] Token refresh: Expired token → refresh → new token stored
- [ ] Error cases: Invalid code, revoked grant, etc.

**Estimated Effort**: 8-12 hours

---

## 📋 Next Sprint Priorities

Based on severity and user impact, here's the recommended priority order for Sprint 3:

1. **UC-043** - Company Info Display (Medium, 8-12h)
2. **UC-073** - Test Coverage branches boost (High, 4-6h)
3. **UC-045** - Job Archiving & Management (Medium, 16-24h)
4. **UC-047** - AI Resume UI Polish (Medium, 8-12h)
5. **Issue #18** - Job URL Scraping improvements (Low, 20-30h)
6. **Issue #19** - Rate limiting on public endpoints (Low, 4-6h)
7. **Issue #20** - Database indexes for performance (Low, 2-3h)

**Total Estimated Effort**: 62-95 hours

---

**Prepared by**: Sprint 2 Team  
**Last Updated**: 2025-11-11  
**Next Review**: Sprint 3 Planning
