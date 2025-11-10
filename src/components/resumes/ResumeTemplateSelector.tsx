import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ResumeTemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

const TEMPLATES = [
  {
    id: "chronological",
    name: "Chronological",
    description: "Traditional format emphasizing work history",
    bestFor: "Most job seekers with consistent work history",
    preview: "linear-gradient(to br, #3b82f6, #8b5cf6)"
  },
  {
    id: "functional",
    name: "Functional",
    description: "Skills-focused format minimizing work history",
    bestFor: "Career changers or gaps in employment",
    preview: "linear-gradient(to br, #ec4899, #f59e0b)"
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Combines skills and chronological sections",
    bestFor: "Professionals with diverse skill sets",
    preview: "linear-gradient(to br, #10b981, #3b82f6)"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean, minimalist design with visual elements",
    bestFor: "Creative and tech professionals",
    preview: "linear-gradient(to br, #8b5cf6, #ec4899)"
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated format for senior positions",
    bestFor: "C-level and senior management roles",
    preview: "linear-gradient(to br, #6b7280, #1f2937)"
  },
  {
    id: "academic",
    name: "Academic",
    description: "Detailed format for research and education",
    bestFor: "Academic positions and research roles",
    preview: "linear-gradient(to br, #0ea5e9, #06b6d4)"
  }
];

export const ResumeTemplateSelector = ({ selectedTemplate, onSelectTemplate }: ResumeTemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a template that best fits your experience and target role
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
              <div
                className="h-32 rounded-md mb-3 flex items-center justify-center"
                style={{ background: template.preview }}
              >
                {selectedTemplate === template.id && (
                  <div className="bg-background/90 rounded-full p-2">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              
              <h4 className="font-semibold mb-1">{template.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {template.description}
              </p>
              <Badge variant="secondary" className="text-xs">
                Best for: {template.bestFor}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
