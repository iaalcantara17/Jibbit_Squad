import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertCircle, Plus, TrendingUp, Award, Download, Clock, Briefcase, GraduationCap, Code, FolderKanban, Medal, Target, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProfileSection {
  id: string;
  name: string;
  isComplete: boolean;
  completionPercentage: number;
  requiredFields: string[];
  completedFields: string[];
}

export const ProfileOverview = () => {
  const { user, profile } = useAuth();
  const [, setSearchParams] = useSearchParams();

  const navigateToSection = (section: string) => {
    setSearchParams({ section });
  };

  const calculateSectionCompletion = (): ProfileSection[] => {
    const basicFields = ['Name', 'Phone', 'Location', 'Headline', 'Bio'];
    const basicCompleted = [
      profile?.name,
      profile?.phone_number,
      profile?.location,
      profile?.professional_headline,
      profile?.bio,
    ].filter(Boolean);

    const hasEmployment = profile?.employment_history && profile.employment_history.length > 0;
    const hasSkills = profile?.skills && profile.skills.length > 0;
    const hasEducation = profile?.education && profile.education.length > 0;
    const hasCertifications = profile?.certifications && profile.certifications.length > 0;
    const hasProjects = profile?.projects && profile.projects.length > 0;

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

  const exportProfile = () => {
    const summary = `
PROFESSIONAL PROFILE SUMMARY
============================

Name: ${profile?.name}
Email: ${profile?.email}
Phone: ${profile?.phone_number || 'N/A'}
Location: ${profile?.location || 'N/A'}
Headline: ${profile?.professional_headline || 'N/A'}

SKILLS: ${profile?.skills?.length || 0} total
EMPLOYMENT: ${profile?.employment_history?.length || 0} positions
EDUCATION: ${profile?.education?.length || 0} degrees
CERTIFICATIONS: ${profile?.certifications?.length || 0} certifications
PROJECTS: ${profile?.projects?.length || 0} projects

Generated on ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile-summary.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sections = calculateSectionCompletion();
  const overallCompletion = Math.round(
    sections.reduce((acc, section) => acc + section.completionPercentage, 0) / sections.length
  );

  const completedSections = sections.filter(s => s.isComplete).length;
  const totalSections = sections.length;

  // Skills distribution data for chart
  const skillsData = [
    { name: 'Technical', value: profile?.skills?.filter((s: any) => s.category === 'Technical').length || 0 },
    { name: 'Soft Skills', value: profile?.skills?.filter((s: any) => s.category === 'Soft Skills').length || 0 },
    { name: 'Languages', value: profile?.skills?.filter((s: any) => s.category === 'Languages').length || 0 },
    { name: 'Industry', value: profile?.skills?.filter((s: any) => s.category === 'Industry-Specific').length || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  // Achievement badges based on milestones
  const achievements = [
    {
      id: 'bronze',
      name: 'Bronze Profile',
      description: 'Complete basic information',
      unlocked: overallCompletion >= 25,
      icon: Medal,
      color: 'text-amber-700',
    },
    {
      id: 'silver',
      name: 'Silver Profile',
      description: 'Complete 50% of your profile',
      unlocked: overallCompletion >= 50,
      icon: Medal,
      color: 'text-gray-400',
    },
    {
      id: 'gold',
      name: 'Gold Profile',
      description: 'Complete 75% of your profile',
      unlocked: overallCompletion >= 75,
      icon: Medal,
      color: 'text-yellow-500',
    },
    {
      id: 'platinum',
      name: 'Platinum Profile',
      description: '100% profile completion',
      unlocked: overallCompletion === 100,
      icon: Award,
      color: 'text-blue-400',
    },
    {
      id: 'skilled',
      name: 'Skilled Professional',
      description: 'Add 10+ skills',
      unlocked: (profile?.skills?.length || 0) >= 10,
      icon: Target,
      color: 'text-purple-500',
    },
    {
      id: 'experienced',
      name: 'Experienced Professional',
      description: 'Add 3+ employment entries',
      unlocked: (profile?.employment_history?.length || 0) >= 3,
      icon: Briefcase,
      color: 'text-green-500',
    },
  ];

  // Industry standards comparison
  const industryStandards = {
    skills: { average: 8, excellent: 15 },
    employment: { average: 2, excellent: 4 },
    education: { average: 1, excellent: 2 },
    projects: { average: 2, excellent: 5 },
    certifications: { average: 1, excellent: 3 },
  };

  const userMetrics = {
    skills: profile?.skills?.length || 0,
    employment: profile?.employment_history?.length || 0,
    education: profile?.education?.length || 0,
    projects: profile?.projects?.length || 0,
    certifications: profile?.certifications?.length || 0,
  };

  const comparisonData = [
    {
      category: 'Skills',
      you: userMetrics.skills,
      average: industryStandards.skills.average,
      excellent: industryStandards.skills.excellent,
    },
    {
      category: 'Experience',
      you: userMetrics.employment,
      average: industryStandards.employment.average,
      excellent: industryStandards.employment.excellent,
    },
    {
      category: 'Education',
      you: userMetrics.education,
      average: industryStandards.education.average,
      excellent: industryStandards.education.excellent,
    },
    {
      category: 'Projects',
      you: userMetrics.projects,
      average: industryStandards.projects.average,
      excellent: industryStandards.projects.excellent,
    },
    {
      category: 'Certifications',
      you: userMetrics.certifications,
      average: industryStandards.certifications.average,
      excellent: industryStandards.certifications.excellent,
    },
  ];

  // Recent activity timeline
  const recentActivity = [
    ...(profile?.employment_history?.slice(0, 2).map((job: any) => ({
      type: 'employment',
      icon: Briefcase,
      title: `Added ${job.jobTitle} at ${job.company}`,
      date: new Date(job.startDate),
    })) || []),
    ...(profile?.education?.slice(0, 2).map((edu: any) => ({
      type: 'education',
      icon: GraduationCap,
      title: `Added ${edu.degree} from ${edu.institution}`,
      date: new Date(edu.graduationDate || edu.startDate),
    })) || []),
    ...(profile?.skills?.slice(0, 3).map(() => ({
      type: 'skills',
      icon: Code,
      title: 'Added new skills',
      date: new Date(),
    })) || []),
    ...(profile?.projects?.slice(0, 2).map((project: any) => ({
      type: 'project',
      icon: FolderKanban,
      title: `Added project: ${project.name}`,
      date: new Date(project.startDate),
    })) || []),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // Career timeline - chronological employment history
  const careerTimeline = [...(profile?.employment_history || [])]
    .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Profile Strength Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profile Strength
            </CardTitle>
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

          <div className="flex gap-2">
            <Button onClick={exportProfile} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export Summary
            </Button>
          </div>

          {overallCompletion === 100 && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <Award className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  🎉 Outstanding! Your profile is 100% complete.
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  You are now maximizing your visibility to employers and recruiters.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Completion Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card
            key={section.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigateToSection(section.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
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
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Complete Section
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg text-center space-y-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/50 border-muted opacity-50'
                }`}
              >
                <achievement.icon
                  className={`h-8 w-8 mx-auto ${
                    achievement.unlocked ? achievement.color : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                {achievement.unlocked && (
                  <Badge variant="default" className="text-xs">
                    Unlocked
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Standards Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Industry Standards Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              See how your profile compares to industry averages and excellent benchmarks.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="you" fill="#8b5cf6" name="You" />
                <Bar dataKey="average" fill="#3b82f6" name="Industry Average" />
                <Bar dataKey="excellent" fill="#10b981" name="Excellent" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center">
                <div className="w-4 h-4 bg-purple-600 rounded mx-auto mb-1"></div>
                <p className="text-xs text-muted-foreground">Your Profile</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-blue-600 rounded mx-auto mb-1"></div>
                <p className="text-xs text-muted-foreground">Industry Average</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-green-600 rounded mx-auto mb-1"></div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Timeline Visualization */}
      {careerTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Career Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6 pl-6 border-l-2 border-primary/20">
              {careerTimeline.map((job, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[29px] mt-1.5 h-4 w-4 rounded-full bg-primary border-4 border-background"></div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{job.title}</p>
                      {job.currentlyWorking && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}{' '}
                      -{' '}
                      {job.currentlyWorking
                        ? 'Present'
                        : new Date(job.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                          })}
                    </p>
                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Distribution Chart */}
      {skillsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      {overallCompletion < 100 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Pro Tips:</strong> Complete all profile sections to stand out. Profiles with 100% completion receive 3x more views from employers!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
