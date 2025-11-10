import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ValidationIssue {
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  suggestion?: string;
}

interface ResumeValidatorProps {
  resumeData: any;
  onValidationComplete?: (score: number, issues: ValidationIssue[]) => void;
}

export const ResumeValidator = ({ resumeData, onValidationComplete }: ResumeValidatorProps) => {
  const [validationScore, setValidationScore] = useState(0);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  useEffect(() => {
    validateResume();
  }, [resumeData]);

  const validateResume = () => {
    const foundIssues: ValidationIssue[] = [];
    let score = 100;

    // Contact Information Validation
    if (!resumeData.personal_info?.email) {
      foundIssues.push({
        type: "error",
        category: "Contact",
        message: "Email address is missing",
        suggestion: "Add your professional email address"
      });
      score -= 10;
    } else if (!isValidEmail(resumeData.personal_info.email)) {
      foundIssues.push({
        type: "warning",
        category: "Contact",
        message: "Email format appears invalid",
        suggestion: "Use a professional email address"
      });
      score -= 5;
    }

    if (!resumeData.personal_info?.phone) {
      foundIssues.push({
        type: "warning",
        category: "Contact",
        message: "Phone number is missing",
        suggestion: "Add a contact phone number"
      });
      score -= 5;
    }

    // Content Length Validation
    const sections = resumeData.sections || [];
    const totalContent = sections
      .filter((s: any) => s.isVisible)
      .map((s: any) => s.content)
      .join(' ');
    
    const wordCount = totalContent.trim().split(/\s+/).length;

    if (wordCount < 200) {
      foundIssues.push({
        type: "error",
        category: "Length",
        message: "Resume is too short",
        suggestion: "Aim for 300-800 words for optimal length"
      });
      score -= 15;
    } else if (wordCount > 1000) {
      foundIssues.push({
        type: "warning",
        category: "Length",
        message: "Resume is quite long",
        suggestion: "Consider condensing to 1-2 pages (600-800 words)"
      });
      score -= 10;
    } else {
      foundIssues.push({
        type: "info",
        category: "Length",
        message: `Resume length is good (${wordCount} words)`,
      });
    }

    // Section Visibility
    const visibleSections = sections.filter((s: any) => s.isVisible);
    if (visibleSections.length < 3) {
      foundIssues.push({
        type: "warning",
        category: "Sections",
        message: "Resume has few sections",
        suggestion: "Include Experience, Skills, and Education sections"
      });
      score -= 10;
    }

    // Skills Section Check
    const hasSkillsSection = sections.some((s: any) => 
      s.type === 'skills' && s.isVisible && s.content.length > 20
    );
    if (!hasSkillsSection) {
      foundIssues.push({
        type: "warning",
        category: "Skills",
        message: "No skills section or it's empty",
        suggestion: "Add a skills section to highlight your expertise"
      });
      score -= 10;
    }

    // Experience Section Check
    const hasExperienceSection = sections.some((s: any) => 
      (s.type === 'experience' || s.type === 'employment') && s.isVisible && s.content.length > 50
    );
    if (!hasExperienceSection) {
      foundIssues.push({
        type: "error",
        category: "Experience",
        message: "No work experience section",
        suggestion: "Add your employment history with achievements"
      });
      score -= 15;
    }

    // Formatting Check - Bullet Points
    const hasBulletPoints = totalContent.includes('•') || totalContent.includes('-');
    if (!hasBulletPoints) {
      foundIssues.push({
        type: "info",
        category: "Formatting",
        message: "Consider using bullet points",
        suggestion: "Bullet points improve readability and ATS compatibility"
      });
      score -= 5;
    }

    // Action Verbs Check
    const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'improved', 'achieved', 'increased', 'reduced'];
    const hasActionVerbs = actionVerbs.some(verb => 
      totalContent.toLowerCase().includes(verb)
    );
    if (!hasActionVerbs) {
      foundIssues.push({
        type: "warning",
        category: "Content",
        message: "Lack of strong action verbs",
        suggestion: "Use verbs like 'led', 'managed', 'developed' to show impact"
      });
      score -= 8;
    }

    // Quantifiable Results Check
    const hasNumbers = /\d+%|\d+\+|\$\d+|increased|decreased|improved by/i.test(totalContent);
    if (!hasNumbers) {
      foundIssues.push({
        type: "info",
        category: "Content",
        message: "No quantifiable achievements found",
        suggestion: "Add metrics and numbers to demonstrate impact (e.g., 'Increased sales by 25%')"
      });
      score -= 5;
    }

    // Professional Tone Check
    const informalWords = ['really', 'very', 'basically', 'stuff', 'things', 'kinda', 'gonna'];
    const hasInformalLanguage = informalWords.some(word => 
      totalContent.toLowerCase().includes(word)
    );
    if (hasInformalLanguage) {
      foundIssues.push({
        type: "warning",
        category: "Tone",
        message: "Informal language detected",
        suggestion: "Use professional language throughout"
      });
      score -= 7;
    }

    const finalScore = Math.max(0, Math.min(100, score));
    setValidationScore(finalScore);
    setIssues(foundIssues);
    
    if (onValidationComplete) {
      onValidationComplete(finalScore, foundIssues);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const errorCount = issues.filter(i => i.type === "error").length;
  const warningCount = issues.filter(i => i.type === "warning").length;
  const infoCount = issues.filter(i => i.type === "info").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(validationScore)}`}>
              {validationScore}/100
            </span>
          </div>
          <Progress value={validationScore} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">
            {getScoreLabel(validationScore)}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errorCount} Errors
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            {warningCount} Warnings
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            {infoCount} Suggestions
          </Badge>
        </div>

        <div className="space-y-2">
          {issues.map((issue, index) => (
            <Alert key={index} variant={issue.type === "error" ? "destructive" : "default"}>
              <div className="flex items-start gap-2">
                {issue.type === "error" && <AlertCircle className="h-4 w-4 mt-0.5" />}
                {issue.type === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600" />}
                {issue.type === "info" && <CheckCircle2 className="h-4 w-4 mt-0.5 text-blue-600" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                    <span className="font-medium text-sm">{issue.message}</span>
                  </div>
                  {issue.suggestion && (
                    <AlertDescription className="mt-1 text-xs">
                      💡 {issue.suggestion}
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
