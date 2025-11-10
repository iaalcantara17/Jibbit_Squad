import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Globe, Users } from "lucide-react";
import type { CompanyInfo } from "@/types/jobs";

interface CompanyInfoSectionProps {
  company: CompanyInfo;
}

export const CompanyInfoSection = ({ company }: CompanyInfoSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {company.logoUrl && (
          <img 
            src={company.logoUrl} 
            alt={`${company.name} logo`}
            className="h-16 w-16 object-contain"
          />
        )}
        
        <div>
          <h3 className="font-semibold text-lg">{company.name}</h3>
          {company.industry && (
            <Badge variant="secondary" className="mt-1">{company.industry}</Badge>
          )}
        </div>

        <div className="space-y-2">
          {company.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{company.location}</span>
            </div>
          )}
          
          {company.size && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{company.size} employees</span>
            </div>
          )}
          
          {company.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
        </div>

        {company.description && (
          <div>
            <h4 className="font-medium mb-2">About</h4>
            <p className="text-sm text-muted-foreground">{company.description}</p>
          </div>
        )}

        {company.glassdoorRating && (
          <div>
            <h4 className="font-medium mb-1">Glassdoor Rating</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{company.glassdoorRating}</span>
              <span className="text-sm text-muted-foreground">/ 5.0</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
