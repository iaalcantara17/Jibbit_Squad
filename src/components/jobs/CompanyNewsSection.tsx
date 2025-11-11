import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewsItem {
  title: string;
  url: string;
  date: string;
  source: string;
  category?: string;
  summary?: string;
}

interface CompanyNewsSectionProps {
  companyName: string;
  news: NewsItem[];
}

export const CompanyNewsSection = ({ companyName, news }: CompanyNewsSectionProps) => {
  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'funding': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'product': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'hiring': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'expansion': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Recent News - {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length > 0 ? (
          <div className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm flex-1">{item.title}</h4>
                  {item.category && (
                    <Badge variant="secondary" className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  )}
                </div>
                
                {item.summary && (
                  <p className="text-sm text-muted-foreground">{item.summary}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <span>{item.source}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.url, '_blank')}
                    className="h-7 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Read More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No recent news available for {companyName}
          </p>
        )}
      </CardContent>
    </Card>
  );
};