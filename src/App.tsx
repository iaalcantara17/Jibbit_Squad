import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
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
 
const queryClient = new QueryClient();
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              {/* Public reviewer page - no auth required */}
              <Route path="/r/:token" element={<PublicReviewerView />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
);

export default App;
