import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, MapPin, Globe, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyResearchProps {
  jobId: string;
}

interface ResearchData {
  companyInfo: {
    name: string;
    size?: string;
    industry?: string;
    headquarters?: string;
    website?: string;
    description?: string;
    founded?: string;
  };
  mission?: string;
  values?: string[];
  culture?: string;
  recentNews?: Array<{
    title: string;
    date: string;
    summary: string;
  }>;
  leadership?: Array<{
    name: string;
    title: string;
  }>;
  products?: string[];
  competitiveLandscape?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
  };
}

export const CompanyResearch = ({ jobId }: CompanyResearchProps) => {
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const conductResearch = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-company-research', {
        body: { jobId }
      });

      if (error) throw error;

      setResearchData(data);
      toast.success("Company research completed");
    } catch (error: any) {
      console.error('Company research error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to research company");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Research
          </CardTitle>
          <Button
            onClick={conductResearch}
            disabled={isLoading}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "Researching..." : researchData ? "Refresh" : "Research Company"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {researchData ? (
          <>
            {/* Company Overview */}
            <div>
              <h4 className="font-semibold mb-3">Company Overview</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{researchData.companyInfo.name}</span>
                </div>
                {researchData.companyInfo.size && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{researchData.companyInfo.size} employees</span>
                  </div>
                )}
                {researchData.companyInfo.headquarters && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{researchData.companyInfo.headquarters}</span>
                  </div>
                )}
                {researchData.companyInfo.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={researchData.companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {researchData.companyInfo.website}
                    </a>
                  </div>
                )}
                {researchData.companyInfo.description && (
                  <p className="text-sm text-muted-foreground mt-2">{researchData.companyInfo.description}</p>
                )}
              </div>
            </div>

            {/* Mission & Values */}
            {(researchData.mission || researchData.values) && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                {researchData.mission && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Mission</h4>
                    <p className="text-sm text-muted-foreground">{researchData.mission}</p>
                  </div>
                )}
                {researchData.values && researchData.values.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Core Values</h4>
                    <div className="flex flex-wrap gap-2">
                      {researchData.values.map((value, index) => (
                        <Badge key={index} variant="secondary">{value}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Culture */}
            {researchData.culture && (
              <div>
                <h4 className="font-semibold mb-2">Company Culture</h4>
                <p className="text-sm text-muted-foreground">{researchData.culture}</p>
              </div>
            )}

            {/* Recent News */}
            {researchData.recentNews && researchData.recentNews.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent News
                </h4>
                <div className="space-y-3">
                  {researchData.recentNews.map((news, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">{news.title}</div>
                      <div className="text-xs text-muted-foreground mb-2">{news.date}</div>
                      <p className="text-sm text-muted-foreground">{news.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leadership */}
            {researchData.leadership && researchData.leadership.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Leadership Team</h4>
                <div className="grid grid-cols-2 gap-3">
                  {researchData.leadership.map((leader, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{leader.name}</div>
                      <div className="text-xs text-muted-foreground">{leader.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products & Services */}
            {researchData.products && researchData.products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Products & Services</h4>
                <div className="flex flex-wrap gap-2">
                  {researchData.products.map((product, index) => (
                    <Badge key={index} variant="outline">{product}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Landscape */}
            {researchData.competitiveLandscape && (
              <div>
                <h4 className="font-semibold mb-2">Competitive Landscape</h4>
                <p className="text-sm text-muted-foreground">{researchData.competitiveLandscape}</p>
              </div>
            )}

            {/* Social Media */}
            {researchData.socialMedia && (
              <div className="flex gap-3">
                {researchData.socialMedia.linkedin && (
                  <a 
                    href={researchData.socialMedia.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn →
                  </a>
                )}
                {researchData.socialMedia.twitter && (
                  <a 
                    href={researchData.socialMedia.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Twitter →
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Research Company" to gather comprehensive information</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
