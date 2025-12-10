import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { initGA4, trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";

// Initialize GA4 on app load
initGA4();

// Component to track page views
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  return null;
}
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import Resumes from "./pages/Resumes";
import CoverLetters from "./pages/CoverLetters";
import CoverLetterPerformance from "./pages/CoverLetterPerformance";
import Analytics from "./pages/Analytics";
import ApplicationSuccessAnalytics from "./pages/ApplicationSuccessAnalytics";
import InterviewPerformanceAnalytics from "./pages/InterviewPerformanceAnalytics";
import NetworkROIAnalytics from "./pages/NetworkROIAnalytics";
import SalaryProgressionAnalytics from "./pages/SalaryProgressionAnalytics";
import Automation from "./pages/Automation";
import CalendarConnect from "./pages/CalendarConnect";
import CalendarCallback from "./pages/CalendarCallback";
import IntegrationsSettings from "./pages/IntegrationsSettings";
import EmailMonitor from "./pages/EmailMonitor";
import EmailIntegration from "./pages/EmailIntegration";
import EmailCallback from "./pages/EmailCallback";
import PublicReviewerView from "./pages/PublicReviewerView";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import InterviewPrep from "./pages/InterviewPrep";
import Network from "./pages/Network";
import Collaboration from "./pages/Collaboration";
import InterviewDetail from "./pages/InterviewDetail";
import QuestionBank from "./pages/QuestionBank";
import QuestionPractice from "./pages/QuestionPractice";
import MockInterviewSession from "./pages/MockInterviewSession";
import MockInterviewSummary from "./pages/MockInterviewSummary";
import TechnicalPrep from "./pages/TechnicalPrep";
import TechnicalChallengeDetail from "./pages/TechnicalChallengeDetail";
import InterviewAnalytics from "./pages/InterviewAnalytics";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import LinkedInOptimization from "./pages/LinkedInOptimization";
import NetworkingCampaigns from "./pages/NetworkingCampaigns";
import Goals from "./pages/Goals";
import TimeInvestment from "./pages/TimeInvestment";
import CustomReports from "./pages/CustomReports";
import Forecasting from "./pages/Forecasting";
import NetworkPowerFeatures from "./pages/NetworkPowerFeatures";
import MarketIntelligence from "./pages/MarketIntelligence";
import Benchmarking from "./pages/Benchmarking";
import SuccessPatterns from "./pages/SuccessPatterns";
import Teams from "./pages/Teams";
import AcceptInvitation from "./pages/AcceptInvitation";
import Documents from "./pages/Documents";
import DocumentViewer from "./pages/DocumentViewer";
import MentorDashboard from "./pages/MentorDashboard";
import MenteeDetail from "./pages/MenteeDetail";
import WeeklyProgress from "./pages/WeeklyProgress";
import SharedProgress from "./pages/SharedProgress";
import FamilyDashboard from "./pages/FamilyDashboard";
import DemoSprint3 from "./pages/DemoSprint3";
import PeerCommunity from "./pages/PeerCommunity";
import InstitutionalAdmin from "./pages/InstitutionalAdmin";
import AdvisorMarketplace from "./pages/AdvisorMarketplace";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
// Sprint 4 imports
import ApplicationSuccessOptimization from "./pages/ApplicationSuccessOptimization";
import ABTestingDashboard from "./pages/ABTestingDashboard";
import InterviewResponseLibrary from "./pages/InterviewResponseLibrary";
import OfferComparisonTool from "./pages/OfferComparisonTool";
import CareerPathSimulation from "./pages/CareerPathSimulation";
import ApiAdminDashboard from "./pages/ApiAdminDashboard";
import JobMap from "./pages/JobMap";
import JobArchive from "./pages/JobArchive";
import { CookieConsent } from "./components/sprint4/CookieConsent";

const queryClient = new QueryClient();
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageViewTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/forgot-password/:token" element={<ForgotPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs" 
                element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/map" 
                element={
                  <ProtectedRoute>
                    <JobMap />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/archive" 
                element={
                  <ProtectedRoute>
                    <JobArchive />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/resumes" 
                element={
                  <ProtectedRoute>
                    <Resumes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cover-letters" 
                element={
                  <ProtectedRoute>
                    <CoverLetters />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cover-letters/performance" 
                element={
                  <ProtectedRoute>
                    <CoverLetterPerformance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/application-success" 
                element={
                  <ProtectedRoute>
                    <ApplicationSuccessAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/interview-performance" 
                element={
                  <ProtectedRoute>
                    <InterviewPerformanceAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/network-roi" 
                element={
                  <ProtectedRoute>
                    <NetworkROIAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/salary-progression" 
                element={
                  <ProtectedRoute>
                    <SalaryProgressionAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interview-analytics" 
                element={
                  <ProtectedRoute>
                    <InterviewAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/automation"
                element={
                  <ProtectedRoute>
                    <Automation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings/integrations"
                element={
                  <ProtectedRoute>
                    <IntegrationsSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/email"
                element={
                  <ProtectedRoute>
                    <EmailMonitor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/email-integration"
                element={
                  <ProtectedRoute>
                    <EmailIntegration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/email/callback" 
                element={
                  <ProtectedRoute>
                    <EmailCallback />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interview-prep"
                element={
                  <ProtectedRoute>
                    <InterviewPrep />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interview/:interviewId"
                element={
                  <ProtectedRoute>
                    <InterviewDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/question-bank"
                element={
                  <ProtectedRoute>
                    <QuestionBank />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/question-practice/:questionId"
                element={
                  <ProtectedRoute>
                    <QuestionPractice />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mock-interview/:sessionId"
                element={
                  <ProtectedRoute>
                    <MockInterviewSession />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mock-interview/:sessionId/summary"
                element={
                  <ProtectedRoute>
                    <MockInterviewSummary />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/technical-prep"
                element={
                  <ProtectedRoute>
                    <TechnicalPrep />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/technical-prep/:challengeId"
                element={
                  <ProtectedRoute>
                    <TechnicalChallengeDetail />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/network"
                element={
                  <ProtectedRoute>
                    <Network />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetail />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/linkedin-optimization"
                element={
                  <ProtectedRoute>
                    <LinkedInOptimization />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/networking-campaigns"
                element={
                  <ProtectedRoute>
                    <NetworkingCampaigns />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/network-power"
                element={
                  <ProtectedRoute>
                    <NetworkPowerFeatures />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/time-investment"
                element={
                  <ProtectedRoute>
                    <TimeInvestment />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/custom-reports"
                element={
                  <ProtectedRoute>
                    <CustomReports />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/forecasting"
                element={
                  <ProtectedRoute>
                    <Forecasting />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/market-intelligence"
                element={
                  <ProtectedRoute>
                    <MarketIntelligence />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/benchmarking"
                element={
                  <ProtectedRoute>
                    <Benchmarking />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/success-patterns"
                element={
                  <ProtectedRoute>
                    <SuccessPatterns />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teams"
                element={
                  <ProtectedRoute>
                    <Teams />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/accept-invitation/:token"
                element={
                  <ProtectedRoute>
                    <AcceptInvitation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/documents/:type/:id"
                element={
                  <ProtectedRoute>
                    <DocumentViewer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/dashboard"
                element={
                  <ProtectedRoute>
                    <MentorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mentor/mentee/:menteeId"
                element={
                  <ProtectedRoute>
                    <MenteeDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/weekly-progress"
                element={
                  <ProtectedRoute>
                    <WeeklyProgress />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/collaboration"
                element={
                  <ProtectedRoute>
                    <Collaboration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/calendar-connect"
                element={
                  <ProtectedRoute>
                    <CalendarConnect />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/calendar/callback" 
                element={
                  <ProtectedRoute>
                    <CalendarCallback />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/family-dashboard"
                element={
                  <ProtectedRoute>
                    <FamilyDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/peer-community"
                element={
                  <ProtectedRoute>
                    <PeerCommunity />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/institutional-admin"
                element={
                  <ProtectedRoute>
                    <InstitutionalAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/advisors"
                element={
                  <ProtectedRoute>
                    <AdvisorMarketplace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/demo/sprint3"
                element={
                  <ProtectedRoute>
                    <DemoSprint3 />
                  </ProtectedRoute>
                } 
              />
              {/* Sprint 4 Routes */}
              <Route 
                path="/optimization"
                element={
                  <ProtectedRoute>
                    <ApplicationSuccessOptimization />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ab-testing"
                element={
                  <ProtectedRoute>
                    <ABTestingDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/interview-responses"
                element={
                  <ProtectedRoute>
                    <InterviewResponseLibrary />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/offer-comparison"
                element={
                  <ProtectedRoute>
                    <OfferComparisonTool />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/career-simulation"
                element={
                  <ProtectedRoute>
                    <CareerPathSimulation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/api"
                element={
                  <ProtectedRoute>
                    <ApiAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Public routes - no auth required */}
              <Route path="/r/:token" element={<PublicReviewerView />} />
              <Route path="/progress/:token" element={<SharedProgress />} />
              {/* Legal pages - public access */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
);

export default App;
