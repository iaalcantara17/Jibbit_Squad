# Sprint 2 - Demo Script

**Audience**: Stakeholders, QA, Product Team  
**Duration**: ~30 minutes  
**Pre-requisites**: Clean DB, test user account, OAuth credentials configured

---

## Setup (5 min)

### 1. Environment Check
```bash
# Verify edge functions are deployed
supabase functions list

# Check secrets
supabase secrets list

# Required secrets:
# - LOVABLE_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GMAIL_REDIRECT_URI
# - GOOGLE_CALENDAR_REDIRECT_URI
# - RESEND_API_KEY (optional for email notifications)
```

### 2. Create Test User
- Navigate to `/register`
- Sign up with: `demo@example.com` / `Demo1234!`
- Verify auto-confirm (no email required)
- Redirects to `/dashboard`

### 3. Seed Profile Data
- Go to `/profile`
- Fill:
  - Name: "Alex Demo"
  - Experience: Senior Software Engineer, 5 years
  - Skills: React, TypeScript, Node.js, PostgreSQL
  - Education: BS Computer Science, 2018
- Save profile

---

## Demo Flow

### Part 1: Job Tracking & Analytics (8 min)

#### UC-036/037/038: Enhanced Job Entry & Tracking
1. **Create Job #1**
   - Navigate to `/jobs` → "Add Job"
   - Title: "Senior Frontend Engineer"
   - Company: "TechCorp"
   - Status: "Interested"
   - Salary: $120k - $160k
   - Deadline: [Today + 14 days]
   - Job Type: "Full-time"
   - Industry: "Software"
   - Contact: `[{"name": "Jane Recruiter", "email": "jane@techcorp.com"}]`
   - Save

2. **Update Status**
   - Open job → Change status to "Applied"
   - Verify: Status badge updates, timeline shows transition
   - Change to "Phone Screen" → Timeline adds entry

3. **Deadline Management**
   - Verify: Deadline badge shows "14 days" (green)
   - Create Job #2 with deadline [Today + 3 days]
   - Verify: Badge shows "3 days" (yellow/red)
   - Go to deadline calendar view
   - Select multiple jobs → "Bulk Extend" → +7 days
   - Verify: Deadlines updated

4. **Next 5 Deadlines Widget**
   - Dashboard shows top 5 upcoming deadlines
   - Sorted by date ascending
   - Click → navigates to job details

#### UC-039: Job Search & Filtering
1. **Create 3 more jobs** (mix of statuses/companies/industries)
2. **Filter Demo**:
   - Filter by status: "Applied" → Shows subset
   - Add company filter: "TechCorp" → Further refined
   - Clear filters
3. **Saved Searches**:
   - Set filters: Status="Interview" + Industry="Software"
   - Click "Save Search" → Name: "Active Tech Interviews"
   - Clear filters → Load saved search
   - Verify: Filters reapply, results highlight

#### UC-041: Job Details View
1. Open any job
2. Show:
   - Full metadata (salary, type, industry, deadline)
   - Status timeline
   - Contacts list
   - Application materials section (empty for now)
   - Company info section (shows basic data, can trigger research)

#### UC-046: Analytics Dashboard
1. Navigate to `/analytics`
2. **KPIs**:
   - Response Rate: X% (offers / applied)
   - Avg Time in Stage: Shows days per status
   - Deadline Adherence: Y% (on-time submissions)
   - Time to Offer: Z days (created → offer)
3. **Charts**:
   - Monthly Applications: Bar chart by month
   - Status Distribution: Pie chart
4. **CSV Export**:
   - Click "Export CSV"
   - Verify: File downloads with headers + all job rows

---

### Part 2: AI Features (10 min)

#### UC-042: Job Match Score
1. Go to a job with "Interested" status
2. Click "Calculate Match Score"
3. Wait ~5s → Modal shows:
   - Overall Score: 82/100
   - Skills Score: 90 (matched: React, TypeScript)
   - Experience Score: 75 (5 years matches)
   - Education Score: 80
   - Gaps: "PostgreSQL DBA experience"
   - Strengths: "Strong frontend skills"
   - Recommendations: "Highlight TypeScript projects"
4. Verify: Score saved, can recalculate

#### UC-044: Company Research
1. Open same job
2. Click "Research Company"
3. Wait ~10s → Company Research tab populates:
   - AI Summary: "TechCorp is a SaaS company..."
   - Recent News: 3 bullets with dates
   - Culture: "Fast-paced, remote-friendly"
   - Competitors: "CompanyX, StartupY"
   - Glassdoor Rating: 4.2 (if available)
4. Verify: Data cached (reload job → instant display)

#### UC-050: AI Resume Generation
1. Navigate to `/resumes`
2. Click "Generate New Resume"
3. Title: "Tech Lead Resume"
4. Template: "Chronological"
5. Click "Generate with AI"
6. Wait ~15s → Preview shows:
   - Header (name, contact from profile)
   - Summary section
   - Experience bullets (from profile)
   - Skills categorized
   - Education
7. **Styling Controls**:
   - Change font size: 11 → 12
   - Change color scheme: Default → Blue
   - Margins: 1 → 0.75
8. Save resume

#### UC-057: Skills Optimization
1. Open saved resume
2. Click "Optimize Skills"
3. Select job: "Senior Frontend Engineer"
4. Wait ~8s → Shows:
   - Skills ranked by relevance (React: 95, PostgreSQL: 60)
   - Suggested categories: Frontend, Backend, Tools
   - Recommended order
5. Check top skills → Click "Apply"
6. Verify: Skills section reordered in resume

#### UC-060: Experience Tailoring
1. Same resume → "Tailor Experience"
2. Select job: "Senior Frontend Engineer"
3. Pick experience entry: "Software Engineer at PrevCo"
4. Click "Generate Variants"
5. Wait ~10s → Shows 3 tailored bullets:
   - Variant 1 (score 92): Emphasizes React migration
   - Variant 2 (score 88): Highlights performance
   - Variant 3 (score 85): Team leadership
6. Accept Variant 1
7. Verify: `resume_experience_variants` table has new row, content updates

#### UC-061: Resume Validation
1. Same resume → "Validate"
2. Shows report:
   - Spelling: 0 issues
   - Grammar: 1 issue (double space)
   - Readability: 65/100
   - Length: 450 words (good)
   - Tone: Professional
   - Overall Score: 82/100
3. Click issues → highlights in preview

#### UC-062/069: Cover Letter Generation
1. Navigate to `/cover-letters`
2. Click "Generate Cover Letter"
3. Select job: "Senior Frontend Engineer"
4. Template: "Formal"
5. Tone: "Professional"
6. **Research Injector** (UC-069):
   - Toggle "Include Company Research"
   - Wait ~12s
   - Generated CL includes:
     - Mission: "TechCorp's mission to democratize..."
     - News bullets: "Recently raised Series B (Jan 2024)"
     - Citations: "[1] TechCrunch, Jan 15, 2024"
7. Save cover letter

---

### Part 3: Integrations (7 min)

#### UC-070: Email Monitoring (Gmail)
1. Navigate to `/settings/integrations`
2. **Connect Gmail**:
   - Click "Connect Gmail"
   - OAuth flow → Redirects to Google
   - Grant read-only access
   - Callback → Shows "Connected" badge
3. **Sync Emails**:
   - Click "Sync Now"
   - Wait ~10s → Toast: "Synced 5 job-related emails"
4. **Email Monitor**:
   - Navigate to `/email`
   - Table shows:
     - Subject: "We received your application"
     - Sender: recruiting@techcorp.com
     - Detected Status: "Applied"
     - Confidence: 92%
     - Matched Job: "Senior Frontend Engineer"
     - Processed: [timestamp]
5. **Manual Apply**:
   - For ambiguous email (no auto-match)
   - Click "Apply Status" → Select job + status
   - Verify: `jobs.status` updates, `application_status_history` logs entry

#### UC-071: Interview Scheduling (Calendar)
1. **Connect Calendar** (in Integrations):
   - Click "Connect Calendar"
   - OAuth → Grant calendar.events access
   - Callback → "Connected" badge
2. **Schedule Interview**:
   - Go to a job (status="Phone Screen")
   - Click "Schedule Interview"
   - Type: "Video"
   - Date: [Tomorrow]
   - Time: 2:00 PM
   - Duration: 60 min
   - Location: "https://zoom.us/j/123456"
   - Interviewer: "Bob Hiring Manager"
   - Notes: "Behavioral + technical"
   - Click "Create & Sync"
3. **Verify**:
   - Toast: "Interview created & synced to Google Calendar"
   - Sync badge: "Synced" (green check)
   - Open Google Calendar → Event exists: "TechCorp – Senior Frontend Engineer Interview"
4. **Reschedule**:
   - Edit interview → Change time to 3:00 PM
   - Click "Update & Sync"
   - Verify: Calendar event updated
5. **Cancel**:
   - Click "Cancel Interview"
   - Confirm → Calendar event deleted
   - Sync badge: "Canceled"

#### UC-054: Resume Collaboration
1. **Generate Share Link**:
   - Go to `/resumes` → Open resume
   - Click "Share"
   - Set expiry: [7 days]
   - Enable comments: ✅
   - Click "Generate Link"
   - Copy link: `https://[app]/r/abc123def456...`
2. **Public Reviewer View**:
   - Open link in incognito/new session (no auth)
   - Shows:
     - Resume preview (read-only)
     - "Add Comment" form (name + body)
   - Post comment: Name="Jane Reviewer", Body="Great skills section!"
   - Submit → Toast: "Comment submitted"
3. **Owner View**:
   - Back to logged-in session
   - Resume share dialog → "View Comments"
   - Shows: Jane's comment with timestamp
   - Click "Export Feedback CSV" → Downloads comments
4. **Revoke Link**:
   - Click "Revoke Link"
   - Confirm
   - Reload public link → Shows "Link expired or invalid"

---

### Part 4: Automation (3 min)

#### UC-Automation (Brief)
1. Navigate to `/automation`
2. **Create Rule**:
   - Name: "Auto-archive rejections after 30 days"
   - Trigger: Status = "Rejected"
   - Condition: `updated_at < now() - interval '30 days'`
   - Action: Set `is_archived = true`
   - Save
3. **Execution Logs**:
   - Go to "Execution Logs" tab
   - Shows past runs (if cron ran)
   - Columns: Rule, Outcome (success/skip), Job, Message, Timestamp
4. **Run Now** (demo only):
   - Click "Run Now" on rule
   - Wait ~2s → Logs update with new entry

---

## Wrap-Up (2 min)

### Key Takeaways
- ✅ **19 UCs delivered**: Job tracking, AI features, integrations, automation
- ✅ **Security**: RLS on all tables, OAuth tokens encrypted, public endpoints tokenized
- ✅ **Performance**: Edge functions avg <2s, AI calls cached where applicable
- ✅ **Coverage**: ≥55% global, ≥90% Sprint-2 components

### Questions & Next Steps
- **Backlog**: UC-043 (company profile), UC-045 (archive flows), advanced CL features
- **Sprint 3**: Performance optimization, user testing, production readiness
- **Feedback**: [Open floor for questions]

---

## Troubleshooting

### Common Issues
1. **OAuth fails**: Check `GOOGLE_CLIENT_ID`, `REDIRECT_URI` in secrets + config.toml
2. **AI slow**: Verify `LOVABLE_API_KEY` is set; check edge function logs
3. **Email sync empty**: Ensure Gmail has job-related emails in last 14 days
4. **Calendar not syncing**: Check token expiry; manually trigger refresh in DB

### Debug Commands
```bash
# Check edge function logs
supabase functions logs email-poller --tail

# Query email tracking
supabase db query "SELECT * FROM email_tracking WHERE user_id = '[uuid]' ORDER BY processed_at DESC LIMIT 10"

# Verify RLS
supabase db query "SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'email_integrations'"
```

---

**Demo Complete** ✅  
**Prepared by**: Sprint 2 Team  
**Last Updated**: 2025-11-11
