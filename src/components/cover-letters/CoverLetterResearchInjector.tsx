import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Building2, Newspaper, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CompanyResearch {
  mission: string;
  size: string;
  industry: string;
  hq: string;
}

interface NewsItem {
  title: string;
  date: string;
  source: string;
  summary: string;
  url: string;
}

interface CoverLetterResearchInjectorProps {
  companyName: string;
  onContentUpdate: (content: string) => void;
  initialContent: string;
}

export const CoverLetterResearchInjector = ({
  companyName,
  onContentUpdate,
  initialContent,
}: CoverLetterResearchInjectorProps) => {
  const [loading, setLoading] = useState(false);
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [includeResearch, setIncludeResearch] = useState(true);
  const [researchOpen, setResearchOpen] = useState(true);
  const { toast } = useToast();

  const fetchResearch = async () => {
    setLoading(true);
    try {
      const [researchData, newsData] = await Promise.all([
        supabase.functions.invoke('ai-company-research', {
          body: { companyName },
        }),
        supabase.functions.invoke('ai-company-news', {
          body: { companyName },
        }),
      ]);

      if (researchData.error) throw researchData.error;
      if (newsData.error) throw newsData.error;

      setResearch(researchData.data);
      setNews(newsData.data?.items?.slice(0, 2) || []);

      // Inject research into content
      if (includeResearch) {
        injectResearch(researchData.data, newsData.data?.items?.slice(0, 2) || []);
      }

      toast({
        title: "Research Loaded",
        description: `Found ${newsData.data?.items?.length || 0} recent news items`,
      });
    } catch (error: any) {
      console.error('Failed to fetch research:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch company research",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const injectResearch = (researchData: CompanyResearch, newsItems: NewsItem[]) => {
    if (!includeResearch) return;

    let injection = '\n\n--- Research Insights ---\n\n';
    
    if (researchData.mission) {
      injection += `${companyName}'s mission to ${researchData.mission.toLowerCase()} aligns with my professional goals.\n\n`;
    }

    if (newsItems.length > 0) {
      injection += 'Recent developments:\n';
      newsItems.forEach(item => {
        injection += `• ${item.date} — ${item.source}: ${item.summary}\n`;
      });
    }

    injection += '\n--- End Research ---\n';

    onContentUpdate(initialContent + injection);
  };

  const handleToggleResearch = (checked: boolean) => {
    setIncludeResearch(checked);
    
    if (!checked) {
      // Remove research block from content
      const cleaned = initialContent.replace(/\n\n--- Research Insights ---[\s\S]*?--- End Research ---\n/g, '');
      onContentUpdate(cleaned);
    } else if (research && news.length > 0) {
      // Re-inject research
      injectResearch(research, news);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Company Research
          </CardTitle>
          <Button onClick={fetchResearch} disabled={loading} size="sm">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load Research
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="include-research"
            checked={includeResearch}
            onCheckedChange={handleToggleResearch}
            disabled={!research}
          />
          <Label htmlFor="include-research">Include research in cover letter</Label>
        </div>

        {research && (
          <Collapsible open={researchOpen} onOpenChange={setResearchOpen}>
            <CollapsibleTrigger className="flex items-center w-full justify-between p-3 bg-accent rounded-md">
              <span className="font-semibold">Research Insights</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${researchOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {research.mission && (
                <div className="p-3 border rounded-md">
                  <p className="text-sm font-semibold mb-1">Mission</p>
                  <p className="text-sm text-muted-foreground">{research.mission}</p>
                </div>
              )}

              {research.industry && (
                <div className="p-3 border rounded-md">
                  <p className="text-sm font-semibold mb-1">Industry</p>
                  <p className="text-sm text-muted-foreground">{research.industry}</p>
                </div>
              )}

              {news.length > 0 && (
                <div className="p-3 border rounded-md">
                  <p className="text-sm font-semibold mb-2 flex items-center">
                    <Newspaper className="h-4 w-4 mr-2" />
                    Recent News
                  </p>
                  <div className="space-y-2">
                    {news.map((item, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date} — {item.source}
                        </p>
                        <p className="text-sm mt-1">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {!research && !loading && (
          <p className="text-center text-muted-foreground py-4">
            Click "Load Research" to fetch company insights and recent news
          </p>
        )}
      </CardContent>
    </Card>
  );
};
