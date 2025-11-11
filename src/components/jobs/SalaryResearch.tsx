import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Lightbulb, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalaryResearchProps {
  jobId: string;
}

interface SalaryData {
  marketRange: {
    min: number;
    median: number;
    max: number;
    currency: string;
  };
  adjustedForExperience: {
    recommended: number;
    range: { min: number; max: number };
  };
  locationAdjustment?: {
    factor: number;
    notes: string;
  };
  totalCompensation?: {
    baseSalary: number;
    bonus: number;
    equity: number;
    benefits: number;
    total: number;
  };
  negotiationStrategy: string[];
  comparisonWithPosted?: string;
  industryBenchmarks?: string[];
}

export const SalaryResearch = ({ jobId }: SalaryResearchProps) => {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const researchSalary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-salary-research', {
        body: { jobId }
      });

      if (error) throw error;

      setSalaryData(data);
      toast.success("Salary research complete");
    } catch (error: any) {
      console.error('Salary research error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to research salary data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Research & Benchmarking
          </CardTitle>
          <Button
            onClick={researchSalary}
            disabled={isLoading}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isLoading ? "Researching..." : salaryData ? "Refresh" : "Research Salary"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {salaryData ? (
          <>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Salary Range
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Minimum</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(salaryData.marketRange.min, salaryData.marketRange.currency)}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-primary/10">
                  <div className="text-sm text-muted-foreground mb-1">Median</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(salaryData.marketRange.median, salaryData.marketRange.currency)}
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">Maximum</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(salaryData.marketRange.max, salaryData.marketRange.currency)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Adjusted For Your Experience</h4>
              <div className="p-4 border rounded-lg bg-accent/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Recommended Target</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {formatCurrency(salaryData.adjustedForExperience.recommended)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Range: {formatCurrency(salaryData.adjustedForExperience.range.min)} - {formatCurrency(salaryData.adjustedForExperience.range.max)}
                </div>
              </div>
            </div>

            {salaryData.locationAdjustment && (
              <div>
                <h4 className="font-semibold mb-2">Location Adjustment</h4>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{(salaryData.locationAdjustment.factor * 100).toFixed(0)}% factor</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{salaryData.locationAdjustment.notes}</p>
                </div>
              </div>
            )}

            {salaryData.totalCompensation && (
              <div>
                <h4 className="font-semibold mb-3">Total Compensation Package</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">Base Salary</span>
                    <span className="font-semibold">{formatCurrency(salaryData.totalCompensation.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">Annual Bonus</span>
                    <span className="font-semibold">{formatCurrency(salaryData.totalCompensation.bonus)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">Equity Value</span>
                    <span className="font-semibold">{formatCurrency(salaryData.totalCompensation.equity)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">Benefits</span>
                    <span className="font-semibold">{formatCurrency(salaryData.totalCompensation.benefits)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-semibold">Total Compensation</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(salaryData.totalCompensation.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Negotiation Strategy
              </h4>
              <ul className="space-y-2">
                {salaryData.negotiationStrategy.map((tip, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {salaryData.comparisonWithPosted && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Comparison with Posted Range</h4>
                <p className="text-sm text-muted-foreground">{salaryData.comparisonWithPosted}</p>
              </div>
            )}

            {salaryData.industryBenchmarks && salaryData.industryBenchmarks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Industry Benchmarks</h4>
                <ul className="space-y-1">
                  {salaryData.industryBenchmarks.map((benchmark, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">→</span>
                      {benchmark}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Research Salary" to get market data and negotiation insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
