import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSection {
  id: string;
  name: string;
  isComplete: boolean;
  completionPercentage: number;
  requiredFields: string[];
  completedFields: string[];
}

export const ProfileOverview = () => {
  const { user } = useAuth();

  const calculateSectionCompletion = (): ProfileSection[] => {
    // Basic Information Section
    const basicFields = ['Name', 'Phone', 'Location', 'Headline', 'Bio', 'Industry', 'Experience Level'];
    const basicCompleted = [
      user?.name,
      user?.basicInfo?.phoneNumber,
      user?.basicInfo?.location,
      user?.basicInfo?.professionalHeadline,
      user?.basicInfo?.bio,
      user?.basicInfo?.industry,
      user?.basicInfo?.experienceLevel,
    ].filter(Boolean);

    // Employment Section - fetch from API via user context
    const hasEmployment = user?.employmentHistory && user.employmentHistory.length > 0;

    // Skills Section - fetch from API via user context
    const hasSkills = user?.skills && user.skills.length > 0;

    // Education Section - fetch from API via user context
    const hasEducation = user?.education && user.education.length > 0;

    // Certifications Section - fetch from API via user context
    const hasCertifications = user?.certifications && user.certifications.length > 0;

    // Projects Section - fetch from API via user context
    const hasProjects = user?.projects && user.projects.length > 0;

    return [
      {
        id: 'basic',
        name: 'Basic Information',
        isComplete: basicCompleted.length === basicFields.length,
        completionPercentage: Math.round((basicCompleted.length / basicFields.length) * 100),
        requiredFields: basicFields,
        completedFields: basicCompleted.map((_, i) => basicFields[i]).filter((_, i) => basicCompleted[i]),
      },
      {
        id: 'employment',
        name: 'Employment History',
        isComplete: hasEmployment,
        completionPercentage: hasEmployment ? 100 : 0,
        requiredFields: ['At least one employment entry'],
        completedFields: hasEmployment ? ['Employment entries added'] : [],
      },
      {
        id: 'skills',
        name: 'Skills',
        isComplete: hasSkills,
        completionPercentage: hasSkills ? 100 : 0,
        requiredFields: ['At least one skill'],
        completedFields: hasSkills ? ['Skills added'] : [],
      },
      {
        id: 'education',
        name: 'Education',
        isComplete: hasEducation,
        completionPercentage: hasEducation ? 100 : 0,
        requiredFields: ['At least one education entry'],
        completedFields: hasEducation ? ['Education entries added'] : [],
      },
      {
        id: 'certifications',
        name: 'Certifications',
        isComplete: hasCertifications,
        completionPercentage: hasCertifications ? 100 : 0,
        requiredFields: ['At least one certification (optional)'],
        completedFields: hasCertifications ? ['Certifications added'] : [],
      },
      {
        id: 'projects',
        name: 'Special Projects',
        isComplete: hasProjects,
        completionPercentage: hasProjects ? 100 : 0,
        requiredFields: ['At least one project (optional)'],
        completedFields: hasProjects ? ['Projects added'] : [],
      },
    ];
  };

  const sections = calculateSectionCompletion();
  const overallCompletion = Math.round(
    sections.reduce((acc, section) => acc + section.completionPercentage, 0) / sections.length
  );

  const completedSections = sections.filter(s => s.isComplete).length;
  const totalSections = sections.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Completion</CardTitle>
          <Badge variant={overallCompletion === 100 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
            {overallCompletion}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{completedSections} of {totalSections} sections complete</span>
          </div>
          <Progress value={overallCompletion} className="h-3" />
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {section.isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : section.completionPercentage > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{section.name}</span>
                  <span className="text-sm text-muted-foreground">{section.completionPercentage}%</span>
                </div>
                
                {section.completionPercentage > 0 && section.completionPercentage < 100 && (
                  <Progress value={section.completionPercentage} className="h-1.5" />
                )}

                {!section.isComplete && (
                  <p className="text-xs text-muted-foreground">
                    {section.requiredFields.length > 1 
                      ? `Complete: ${section.requiredFields.join(', ')}`
                      : section.requiredFields[0]
                    }
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {overallCompletion === 100 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Congratulations! Your profile is 100% complete.
              </p>
            </div>
          </div>
        )}

        {overallCompletion < 100 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Complete all sections to make your profile stand out to employers and increase your visibility.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
