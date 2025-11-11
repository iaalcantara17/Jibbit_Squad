import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface CoverLetterTemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

const TEMPLATES = [
  {
    id: "formal",
    name: "Formal",
    description: "Traditional business format",
    bestFor: "Corporate, finance, legal positions",
    tone: "Professional and conservative"
  },
  {
    id: "creative",
    name: "Creative",
    description: "Engaging narrative style",
    bestFor: "Marketing, design, creative roles",
    tone: "Enthusiastic and personable"
  },
  {
    id: "technical",
    name: "Technical",
    description: "Skills-focused approach",
    bestFor: "Engineering, IT, research roles",
    tone: "Precise and analytical"
  },
  {
    id: "startup",
    name: "Startup",
    description: "Dynamic and flexible",
    bestFor: "Startups and fast-paced environments",
    tone: "Casual yet professional"
  },
  {
    id: "executive",
    name: "Executive",
    description: "Strategic and leadership-focused",
    bestFor: "C-level and senior management",
    tone: "Authoritative and visionary"
  },
  {
    id: "academic",
    name: "Academic",
    description: "Research and teaching emphasis",
    bestFor: "University and research positions",
    tone: "Scholarly and detailed"
  }
];

export const CoverLetterTemplateSelector = ({ 
  selectedTemplate, 
  onSelectTemplate 
}: CoverLetterTemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a Style</h3>
        <p className="text-sm text-muted-foreground">
          Select a template that matches the company culture and role
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{template.name}</h4>
                {selectedTemplate === template.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              
              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs mr-2">
                  {template.bestFor}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Tone: {template.tone}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
