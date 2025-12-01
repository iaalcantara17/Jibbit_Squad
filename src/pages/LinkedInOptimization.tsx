import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Linkedin, FileText } from 'lucide-react';
import { LinkedInTemplates } from '@/components/network/LinkedInTemplates';

const sections = [
  {
    title: "Profile Basics",
    items: [
      {
        label: "Professional Photo",
        description: "Use a high-quality headshot with professional attire and neutral background"
      },
      {
        label: "Compelling Headline",
        description: "Go beyond job title - include your value proposition (120 characters max)"
      },
      {
        label: "Custom URL",
        description: "Customize your LinkedIn URL to yourname for a professional look"
      },
      {
        label: "Contact Information",
        description: "Add email, phone, and other professional contact details"
      }
    ]
  },
  {
    title: "About Section",
    items: [
      {
        label: "Engaging Summary",
        description: "Write in first person, tell your story, highlight achievements (2000 characters)"
      },
      {
        label: "Keywords Integration",
        description: "Include industry-relevant keywords naturally throughout your summary"
      },
      {
        label: "Call to Action",
        description: "End with how people can connect with you or what you're looking for"
      }
    ]
  },
  {
    title: "Experience Section",
    items: [
      {
        label: "Detailed Job Descriptions",
        description: "Use bullet points to highlight achievements, not just responsibilities"
      },
      {
        label: "Quantifiable Results",
        description: "Include metrics and numbers to demonstrate impact (increased sales by X%)"
      },
      {
        label: "Rich Media",
        description: "Add presentations, projects, articles, or portfolio pieces to each role"
      },
      {
        label: "Complete Work History",
        description: "Fill in all positions, even if brief - shows career progression"
      }
    ]
  },
  {
    title: "Skills & Endorsements",
    items: [
      {
        label: "Strategic Skills Selection",
        description: "Pin top 3 skills that align with your career goals"
      },
      {
        label: "50 Skills Maximum",
        description: "Add up to 50 relevant skills prioritized by importance"
      },
      {
        label: "Seek Endorsements",
        description: "Request endorsements from colleagues for your key skills"
      }
    ]
  },
  {
    title: "Recommendations",
    items: [
      {
        label: "Quality over Quantity",
        description: "Aim for 3-5 strong recommendations from managers or clients"
      },
      {
        label: "Reciprocate",
        description: "Write recommendations for others - they often return the favor"
      },
      {
        label: "Be Specific",
        description: "When requesting, mention specific projects you worked on together"
      }
    ]
  },
  {
    title: "Engagement & Activity",
    items: [
      {
        label: "Regular Posting",
        description: "Share insights, articles, or achievements 2-3 times per week"
      },
      {
        label: "Engage with Content",
        description: "Comment thoughtfully on posts in your network and industry"
      },
      {
        label: "Join Groups",
        description: "Participate in 3-5 relevant professional groups"
      },
      {
        label: "Follow Companies",
        description: "Follow target companies and engage with their content"
      }
    ]
  },
  {
    title: "Additional Sections",
    items: [
      {
        label: "Certifications",
        description: "Add all relevant certifications with expiration dates if applicable"
      },
      {
        label: "Volunteer Experience",
        description: "Showcase community involvement and leadership"
      },
      {
        label: "Projects",
        description: "Highlight significant projects with descriptions and outcomes"
      },
      {
        label: "Publications",
        description: "Link to articles, papers, or content you've published"
      }
    ]
  },
  {
    title: "Profile SEO",
    items: [
      {
        label: "Keyword Optimization",
        description: "Research and include keywords recruiters search for in your field"
      },
      {
        label: "Complete All Sections",
        description: "Profiles with all sections filled rank higher in searches"
      },
      {
        label: "Profile Strength",
        description: "Aim for 'All-Star' profile strength rating"
      }
    ]
  }
];

const LinkedInOptimization = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#0077B5]/10 p-3">
              <Linkedin className="h-6 w-6 text-[#0077B5]" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">LinkedIn Resources</h1>
              <p className="text-muted-foreground mt-2">
                Templates, checklists, and guidance to maximize your LinkedIn presence
              </p>
            </div>
          </div>

          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Optimization Checklist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6 mt-6">
              <LinkedInTemplates />
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6 mt-6">{/* ... keep existing code (optimization checklist content) */}

          <Card className="border-[#0077B5]/20">
            <CardHeader>
              <CardTitle>Why Optimize Your LinkedIn Profile?</CardTitle>
              <CardDescription className="text-base">
                A well-optimized LinkedIn profile can:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Increase profile views by up to 40x with 'All-Star' status</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Appear higher in recruiter searches for relevant positions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Attract more connection requests from industry professionals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Demonstrate professionalism to potential employers</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {sections.map((section, sectionIndex) => (
              <Card key={sectionIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {section.title}
                      <Badge variant="secondary" className="ml-2">
                        {section.items.length} items
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-5 w-5 rounded-full border-2 border-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.label}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Consistency is Key:</strong> Update your profile regularly with new achievements, skills, and experiences.
              </p>
              <p className="text-sm">
                <strong>Be Authentic:</strong> While optimizing for search, ensure your profile genuinely reflects your professional brand.
              </p>
              <p className="text-sm">
                <strong>Privacy Settings:</strong> Review your privacy settings to control who sees your activity and profile updates.
              </p>
              <p className="text-sm">
                <strong>Mobile Optimization:</strong> Over 60% of LinkedIn users access via mobile - check how your profile looks on mobile devices.
              </p>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LinkedInOptimization;