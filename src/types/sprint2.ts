// Sprint 2 Type Definitions for MongoDB Models

export interface Job {
  _id?: string;
  userId: string;
  
  // Basic Information (UC-036)
  title: string;
  company: string;
  location?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  
  // Job Details
  jobPostingUrl?: string;
  applicationDeadline?: Date;
  jobDescription?: string; // max 2000 chars
  industry?: string;
  jobType?: string;
  
  // Status Pipeline (UC-037)
  status: JobStatus;
  statusHistory: StatusHistoryEntry[];
  daysInCurrentStage?: number;
  
  // Notes and Details (UC-038)
  notes?: string;
  contacts?: Contact[];
  applicationHistory?: ApplicationHistoryEntry[];
  salaryNegotiationNotes?: string;
  interviewNotes?: InterviewNote[];
  
  // URL Import (UC-041)
  importMetadata?: {
    importDate: Date;
    source: string;
    importStatus: string;
    autoPopulatedFields: string[];
  };
  
  // Application Materials (UC-042)
  applicationMaterials?: {
    resumeId?: string;
    resumeVersion?: string;
    coverLetterId?: string;
    coverLetterVersion?: string;
    attachedDate?: Date;
  };
  materialsHistory?: MaterialsHistoryEntry[];
  
  // Company Reference (UC-043)
  companyId?: string;
  
  // Deadline Tracking (UC-040)
  deadlineStatus?: DeadlineStatus;
  deadlineReminders?: DeadlineReminder[];
  deadlineExtended?: boolean;
  originalDeadline?: Date;
  
  // Archiving (UC-045)
  archived?: boolean;
  archiveReason?: string;
  archivedDate?: Date;
  autoArchiveDate?: Date;
  
  // Search and Filtering (UC-039)
  tags?: string[];
  searchKeywords?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
}

export type JobStatus = 
  | 'Interested'
  | 'Applied'
  | 'Phone Screen'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export type DeadlineStatus = 'upcoming' | 'urgent' | 'overdue';

export interface StatusHistoryEntry {
  status: JobStatus;
  timestamp: Date;
  note?: string;
}

export interface Contact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ApplicationHistoryEntry {
  action: string;
  timestamp: Date;
  details?: string;
}

export interface InterviewNote {
  interviewDate: Date;
  interviewType: string;
  interviewer?: string;
  feedback?: string;
  outcome?: string;
}

export interface MaterialsHistoryEntry {
  resumeId?: string;
  coverLetterId?: string;
  attachedDate: Date;
  updatedDate?: Date;
}

export interface DeadlineReminder {
  reminderDate: Date;
  sent: boolean;
  type: string;
}

// Resume Types (UC-046 to UC-054)
export interface Resume {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  version: string;
  isDefault: boolean;
  
  templateType: ResumeTemplateType;
  templateStyle: {
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    layout: string;
  };
  
  sections: ResumeSection[];
  sectionPresets?: string[];
  
  contactInfo: ContactInfo;
  summary?: string;
  experience: ExperienceEntry[];
  skills: SkillsSection;
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  
  aiMetadata?: AIMetadata;
  validation?: ValidationResult;
  versionHistory?: VersionHistoryEntry[];
  linkedJobApplications?: string[];
  exportSettings?: ExportSettings;
  shareableLink?: string;
  privacySettings?: PrivacySettings;
  usageStats?: UsageStats;
  
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt?: Date;
  archivedDate?: Date;
}

export type ResumeTemplateType = 'chronological' | 'functional' | 'hybrid';

export interface ResumeSection {
  type: string;
  enabled: boolean;
  order: number;
  content: any;
  completionStatus: 'complete' | 'incomplete' | 'needs-review';
  formatting?: {
    style: string;
    spacing: string;
  };
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
}

export interface ExperienceEntry {
  employmentId?: string;
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  bullets: string[];
  aiGenerated: boolean;
  relevanceScore?: number;
  tailoredForJobId?: string;
  variations?: ExperienceVariation[];
}

export interface ExperienceVariation {
  content: string[];
  generatedDate: Date;
  usedForJobId?: string;
}

export interface SkillsSection {
  technical: TechnicalSkill[];
  soft: SoftSkill[];
  aiOptimized: boolean;
  optimizedForJobId?: string;
  matchingScore?: number;
}

export interface TechnicalSkill {
  skillId?: string;
  name: string;
  displayOrder: number;
  relevanceScore?: number;
  emphasized: boolean;
}

export interface SoftSkill {
  name: string;
  displayOrder: number;
  relevanceScore?: number;
}

export interface EducationEntry {
  educationId?: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: Date;
  gpa?: number;
  honors?: string[];
}

export interface ProjectEntry {
  projectId?: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface CertificationEntry {
  certificationId?: string;
  name: string;
  issuer: string;
  dateObtained: Date;
  expirationDate?: Date;
}

export interface AIMetadata {
  generatedForJobId?: string;
  generationDate: Date;
  model: string;
  prompt: string;
  atsOptimized: boolean;
  keywords: string[];
  contentVariations: number;
}

export interface ValidationResult {
  lastCheckedDate: Date;
  spellCheckPassed: boolean;
  grammarCheckPassed: boolean;
  formatConsistent: boolean;
  lengthOptimal: boolean;
  missingInfoWarnings: string[];
  contactInfoValid: boolean;
  professionalTone: boolean;
  readabilityScore: number;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

export interface VersionHistoryEntry {
  versionNumber: string;
  createdDate: Date;
  changes: string;
  createdFromJobId?: string;
}

export interface ExportSettings {
  defaultFormat: 'PDF' | 'DOCX' | 'TXT' | 'HTML';
  theme: string;
  watermark?: string;
  branding?: {
    enabled: boolean;
    logoUrl?: string;
    text?: string;
  };
  customFilename?: string;
}

export interface PrivacySettings {
  isPublic: boolean;
  allowComments: boolean;
  expirationDate?: Date;
}

export interface UsageStats {
  timesUsed: number;
  lastUsedDate?: Date;
  successfulApplications: number;
  responseRate: number;
}

// Cover Letter Types (UC-055 to UC-062)
export interface CoverLetter {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  jobId?: string;
  
  templateType: CoverLetterTemplateType;
  templateStyle: {
    layout: string;
    formatting: any;
  };
  industrySpecific?: string;
  
  content: CoverLetterContent;
  aiMetadata?: AIMetadata;
  companyResearch?: CompanyResearchData;
  styleSettings: StyleSettings;
  toneConsistency?: ToneConsistency;
  highlightedExperiences: HighlightedExperience[];
  alternativePresentations?: AlternativePresentation[];
  editingHistory: EditingHistoryEntry[];
  validation?: ValidationResult;
  autoSaveEnabled: boolean;
  lastAutoSave?: Date;
  exportSettings?: ExportSettings;
  performanceId?: string;
  version?: string;
  parentCoverLetterId?: string;
  
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt?: Date;
  usedForApplicationDate?: Date;
}

export type CoverLetterTemplateType = 'formal' | 'creative' | 'technical';

export interface CoverLetterContent {
  greeting: string;
  openingParagraph: string;
  bodyParagraphs: string[];
  closingParagraph: string;
  signature: string;
}

export interface CompanyResearchData {
  companyId?: string;
  includedElements: string[];
  recentNews: string[];
  missionAlignment: string;
  initiatives: string[];
}

export interface StyleSettings {
  tone: 'formal' | 'casual' | 'enthusiastic' | 'analytical';
  industryLanguage: boolean;
  companyCulture: string;
  length: 'brief' | 'standard' | 'detailed';
  writingStyle: 'direct' | 'narrative' | 'bullet-points';
  customInstructions?: string;
}

export interface ToneConsistency {
  validated: boolean;
  score: number;
  suggestions: string[];
}

export interface HighlightedExperience {
  experienceId?: string;
  narrative: string;
  quantifiedAchievements: string[];
  relevanceScore: number;
  connectionToJob: string;
}

export interface AlternativePresentation {
  experienceId?: string;
  variation: string;
  score: number;
}

export interface EditingHistoryEntry {
  timestamp: Date;
  changes: string;
  version: string;
}

// Company Research Types (UC-063, UC-064)
export interface CompanyResearch {
  _id?: string;
  companyName: string;
  userId: string;
  
  basicInfo: CompanyBasicInfo;
  profile: CompanyProfile;
  leadership: LeadershipMember[];
  news: NewsArticle[];
  socialMedia: SocialMediaLinks;
  ratings: CompanyRatings;
  financial: FinancialInfo;
  competitive: CompetitiveInfo;
  summary: ResearchSummary;
  alerts: NewsAlert[];
  contactInfo: CompanyContactInfo;
  
  lastResearchDate: Date;
  nextUpdateDate?: Date;
  researchStatus: 'complete' | 'partial' | 'pending' | 'failed';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyBasicInfo {
  legalName?: string;
  industry?: string;
  size?: string;
  headquarters?: {
    city: string;
    state: string;
    country: string;
  };
  founded?: number;
  website?: string;
  logoUrl?: string;
}

export interface CompanyProfile {
  mission?: string;
  values?: string[];
  culture?: string;
  description?: string;
  productsServices?: string[];
  targetMarket?: string;
}

export interface LeadershipMember {
  name: string;
  title: string;
  bio?: string;
  linkedinUrl?: string;
  photoUrl?: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishDate: Date;
  category: string;
  summary: string;
  keyPoints: string[];
  relevanceScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface SocialMediaLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  glassdoor?: string;
}

export interface CompanyRatings {
  glassdoor?: {
    overallRating: number;
    ceoApproval: number;
    recommendToFriend: number;
    totalReviews: number;
    url: string;
  };
  indeed?: {
    rating: number;
    totalReviews: number;
  };
}

export interface FinancialInfo {
  revenue?: string;
  funding?: {
    totalRaised: number;
    lastRound: {
      type: string;
      amount: number;
      date: Date;
      investors: string[];
    };
  };
  publiclyTraded: boolean;
  stockSymbol?: string;
}

export interface CompetitiveInfo {
  mainCompetitors: string[];
  marketPosition?: string;
  differentiators?: string[];
}

export interface ResearchSummary {
  generatedDate: Date;
  summaryText: string;
  keyTakeaways: string[];
  strengthsOpportunities: string[];
}

export interface NewsAlert {
  userId: string;
  alertType: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  keywords: string[];
  lastSent?: Date;
}

export interface CompanyContactInfo {
  generalEmail?: string;
  phone?: string;
  recruitmentEmail?: string;
  pressEmail?: string;
}

// Job Matching Types (UC-065, UC-066)
export interface JobMatchScore {
  _id?: string;
  userId: string;
  jobId: string;
  
  overallScore: number;
  calculatedDate: Date;
  
  categoryScores: CategoryScores;
  strengths: Strength[];
  gaps: Gap[];
  skillsGap: SkillsGapAnalysis;
  learningPathId?: string;
  improvementSuggestions: ImprovementSuggestion[];
  comparisons: JobComparison[];
  scoreHistory: ScoreHistoryEntry[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryScores {
  skills: CategoryScore;
  experience: CategoryScore;
  education: CategoryScore;
  certifications: CategoryScore;
  location: CategoryScore;
}

export interface CategoryScore {
  score: number;
  weight: number;
  details: string;
}

export interface Strength {
  category: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Gap {
  category: string;
  description: string;
  severity: 'critical' | 'important' | 'minor';
  improvementSuggestion: string;
}

export interface SkillsGapAnalysis {
  requiredSkills: RequiredSkill[];
  missingSkills: MissingSkill[];
  weakSkills: WeakSkill[];
}

export interface RequiredSkill {
  skillName: string;
  importance: 'required' | 'preferred' | 'nice-to-have';
  userHasSkill: boolean;
  userProficiency?: number;
  gap: 'missing' | 'weak' | 'adequate' | 'strong';
}

export interface MissingSkill {
  skillName: string;
  importance: string;
  priority: number;
  impactOnMatch: number;
}

export interface WeakSkill {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  improvementNeeded: string;
}

export interface ImprovementSuggestion {
  type: string;
  description: string;
  expectedScoreIncrease: number;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface JobComparison {
  otherJobId: string;
  otherJobTitle: string;
  otherJobScore: number;
  differenceAnalysis: string;
}

export interface ScoreHistoryEntry {
  score: number;
  date: Date;
  changedBecause: string;
}

// Analytics Types (UC-044, UC-072)
export interface Analytics {
  _id?: string;
  userId: string;
  
  jobStats: JobStatistics;
  pipelineAnalytics: PipelineAnalytics;
  benchmarking: Benchmarking;
  recommendations: AnalyticsRecommendation[];
  exports: ExportHistoryEntry[];
  
  lastCalculated: Date;
  calculationFrequency: string;
  dataRange: {
    startDate: Date;
    endDate: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStatistics {
  totalJobs: number;
  byStatus: Record<JobStatus, number>;
  applicationResponseRate: number;
  averageTimeInStage: Record<JobStatus, number>;
  monthlyApplicationVolume: MonthlyVolume[];
  deadlineAdherence: DeadlineAdherence;
  timeToOffer: TimeToOffer;
}

export interface MonthlyVolume {
  month: string;
  count: number;
}

export interface DeadlineAdherence {
  onTime: number;
  late: number;
  adherenceRate: number;
}

export interface TimeToOffer {
  averageDays: number;
  fastestDays: number;
  slowestDays: number;
}

export interface PipelineAnalytics {
  funnelData: FunnelData;
  timeToResponse: TimeToResponse[];
  successRateByApproach: SuccessRateByApproach[];
  volumeTrends: VolumeTrend[];
}

export interface FunnelData {
  applied: number;
  phoneScreen: number;
  interview: number;
  offer: number;
  conversionRates: {
    appliedToScreen: number;
    screenToInterview: number;
    interviewToOffer: number;
  };
}

export interface TimeToResponse {
  companyName: string;
  industry: string;
  averageDays: number;
}

export interface SuccessRateByApproach {
  approach: string;
  applications: number;
  successRate: number;
}

export interface VolumeTrend {
  week: string;
  applications: number;
  interviews: number;
  offers: number;
}

export interface Benchmarking {
  industryAverages: IndustryAverages;
  userVsIndustry: UserVsIndustry;
}

export interface IndustryAverages {
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  timeToOffer: number;
}

export interface UserVsIndustry {
  responseRateDiff: number;
  interviewRateDiff: number;
  offerRateDiff: number;
}

export interface AnalyticsRecommendation {
  type: string;
  recommendation: string;
  basedOn: string;
  expectedImpact: 'high' | 'medium' | 'low';
  priority: number;
  generatedDate: Date;
}

export interface ExportHistoryEntry {
  exportDate: Date;
  exportType: string;
  format: string;
  fileName: string;
}

// User Preferences Types (UC-039, UC-045, UC-046, UC-065)
export interface UserPreferences {
  _id?: string;
  userId: string;
  
  savedSearches: SavedSearch[];
  defaultResumeTemplateId?: string;
  autoArchive: AutoArchiveSettings;
  matchScoreWeights: MatchScoreWeights;
  notifications: NotificationPreferences;
  goals: Goal[];
  dashboardWidgets: DashboardWidget[];
  exportDefaults: ExportDefaults;
  privacy: PrivacyPreferences;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedSearch {
  searchName: string;
  filters: SearchFilters;
  sortBy: string;
  isDefault: boolean;
  lastUsed?: Date;
}

export interface SearchFilters {
  status?: JobStatus[];
  industry?: string[];
  location?: string[];
  salaryRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  keywords?: string[];
}

export interface AutoArchiveSettings {
  enabled: boolean;
  archiveAfterDays: number;
  archiveStatuses: JobStatus[];
  notifyBeforeArchive: boolean;
  notifyDaysBefore: number;
}

export interface MatchScoreWeights {
  skills: number;
  experience: number;
  education: number;
  certifications: number;
  location: number;
  customWeights?: CustomWeight[];
}

export interface CustomWeight {
  factor: string;
  weight: number;
}

export interface NotificationPreferences {
  deadlineReminders: DeadlineReminderSettings;
  statusChanges: StatusChangeSettings;
  companyNews: CompanyNewsSettings;
  applicationUpdates: ApplicationUpdateSettings;
}

export interface DeadlineReminderSettings {
  enabled: boolean;
  reminderDaysBefore: number[];
  deliveryMethod: string[];
}

export interface StatusChangeSettings {
  enabled: boolean;
  notifyOn: JobStatus[];
  deliveryMethod: string[];
}

export interface CompanyNewsSettings {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  deliveryMethod: string[];
}

export interface ApplicationUpdateSettings {
  enabled: boolean;
  autoDetection: boolean;
  deliveryMethod: string[];
}

export interface Goal {
  goalType: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  status: 'on-track' | 'behind' | 'achieved';
}

export interface DashboardWidget {
  widgetType: string;
  position: number;
  visible: boolean;
  settings: any;
}

export interface ExportDefaults {
  resumeFormat: string;
  coverLetterFormat: string;
  includeWatermark: boolean;
  fileNamingPattern: string;
}

export interface PrivacyPreferences {
  allowResumeFeedback: boolean;
  allowDataSharing: boolean;
  allowAnalytics: boolean;
}
