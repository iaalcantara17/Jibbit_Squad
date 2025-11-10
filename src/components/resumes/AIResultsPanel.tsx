import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface AIResult {
  type: 'content' | 'skills' | 'experience';
  data: any;
}

interface AIResultsPanelProps {
  result: AIResult | null;
  onApply: (data: any) => void;
  onDismiss: () => void;
}

export function AIResultsPanel({ result, onApply, onDismiss }: AIResultsPanelProps) {
  if (!result) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleApply = () => {
    onApply(result.data);
    toast.success("Applied AI suggestions");
  };

  const renderContentResults = () => {
    const { summary, experience, skills } = result.data;

    return (
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-3">
          {summary?.suggestions?.map((item: string, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg bg-muted/50">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm flex-1">{item}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(item)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="experience" className="space-y-3">
          {experience?.bulletPoints?.map((item: any, idx: number) => (
            <div key={idx} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.role || 'Position'}</Badge>
                {item.relevance && (
                  <Badge variant={item.relevance >= 80 ? 'default' : 'outline'}>
                    {item.relevance}% match
                  </Badge>
                )}
              </div>
              <ul className="space-y-1 list-disc list-inside text-sm">
                {item.points?.map((point: string, pidx: number) => (
                  <li key={pidx} className="text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Recommended Skills to Highlight:</p>
            <div className="flex flex-wrap gap-2">
              {skills?.highlighted?.map((skill: string, idx: number) => (
                <Badge key={idx} variant="default">{skill}</Badge>
              ))}
            </div>
          </div>
          {skills?.suggested?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Consider Adding:</p>
              <div className="flex flex-wrap gap-2">
                {skills.suggested.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  const renderSkillsResults = () => {
    const { optimized, suggested, relevanceScores } = result.data;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-3">Optimized Skills Order</h4>
          <div className="space-y-2">
            {optimized?.map((skill: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{skill.name}</span>
                <Badge variant={skill.relevance >= 80 ? 'default' : 'secondary'}>
                  {skill.relevance}% relevant
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {suggested?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Skills to Add</h4>
            <div className="flex flex-wrap gap-2">
              {suggested.map((skill: string, idx: number) => (
                <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-primary/10">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExperienceResults = () => {
    const { tailored } = result.data;

    return (
      <div className="space-y-4">
        {tailored?.map((exp: any, idx: number) => (
          <div key={idx} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{exp.role}</h4>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
              </div>
              <Badge variant={exp.relevance >= 70 ? 'default' : 'secondary'}>
                {exp.relevance}% match
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Tailored Descriptions:</p>
              <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                {exp.descriptions?.map((desc: string, didx: number) => (
                  <li key={didx}>{desc}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Suggestions
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply}>
              <Check className="h-4 w-4 mr-2" />
              Apply All
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {result.type === 'content' && renderContentResults()}
        {result.type === 'skills' && renderSkillsResults()}
        {result.type === 'experience' && renderExperienceResults()}
      </CardContent>
    </Card>
  );
}
