import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SkillOptimizationResult {
  score: number;
  emphasize: string[];
  add: string[];
  technical: string[];
  soft: string[];
  gaps: Array<{ skill: string; reason: string }>;
}

interface ResumeSkillsOptimizerProps {
  jobId: string;
  currentSkills: string[];
  onApplySkills: (skills: string[]) => void;
}

export const ResumeSkillsOptimizer = ({ jobId, currentSkills, onApplySkills }: ResumeSkillsOptimizerProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillOptimizationResult | null>(null);
  const [previewSkills, setPreviewSkills] = useState<string[]>([]);
  const { toast } = useToast();

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-optimize-skills', {
        body: { jobId },
      });

      if (error) throw error;

      setResult(data);
      
      // Generate preview of optimized skills
      const optimized = [
        ...currentSkills.filter(s => data.emphasize.includes(s)),
        ...data.add,
      ];
      setPreviewSkills(optimized);

      toast({
        title: "Optimization Complete",
        description: `Match score: ${data.score}%`,
      });
    } catch (error: any) {
      console.error('Optimization failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to optimize skills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewSkills.length > 0) {
      onApplySkills(previewSkills);
      toast({
        title: "Skills Updated",
        description: `${previewSkills.length} skills applied to resume`,
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Skills Optimization</span>
          <Button onClick={handleOptimize} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Skills
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Analyzing your skills...</p>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="flex items-center justify-between p-4 bg-accent rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Match Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </p>
              </div>
              <Badge variant={getScoreBadgeVariant(result.score)} className="text-lg px-4 py-2">
                {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>

            {result.technical.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                  Technical Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.technical.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.soft.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Soft Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.soft.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.emphasize.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills to Emphasize</h4>
                <div className="flex flex-wrap gap-2">
                  {result.emphasize.map((skill) => (
                    <Badge key={skill} variant="default">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.add.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommended Skills to Add</h4>
                <div className="flex flex-wrap gap-2">
                  {result.add.map((skill) => (
                    <Badge key={skill} className="bg-purple-600">
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.gaps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                  Skill Gaps
                </h4>
                <div className="space-y-2">
                  {result.gaps.map((gap, index) => (
                    <div key={index} className="p-2 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-800">
                      <p className="font-medium text-sm">{gap.skill}</p>
                      <p className="text-xs text-muted-foreground">{gap.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewSkills.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Preview Optimized Skills</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {previewSkills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Button onClick={handleApply} className="w-full">
                  Apply to Resume
                </Button>
              </div>
            )}
          </>
        )}

        {!result && !loading && (
          <p className="text-center text-muted-foreground py-8">
            Click "Analyze Skills" to get optimization suggestions for this job
          </p>
        )}
      </CardContent>
    </Card>
  );
};
