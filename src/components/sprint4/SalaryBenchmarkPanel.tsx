import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SalaryBenchmarkPanelProps {
  jobTitle: string;
  location: string;
  jobId?: string;
}

interface SalaryData {
  median_salary: number;
  percentile_25: number;
  percentile_75: number;
  percentile_90: number;
  sample_size: number;
  source: string;
  data_date: string;
}

export const SalaryBenchmarkPanel = ({ jobTitle, location, jobId }: SalaryBenchmarkPanelProps) => {
  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalaryData = async () => {
    if (!jobTitle) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('salary-benchmark', {
        body: { jobTitle, location: location || 'United States' }
      });

      if (fnError) throw fnError;

      if (data?.salary) {
        setSalaryData(data.salary);
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch salary data:', err);
      setError('Unable to retrieve salary benchmarks at this time');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [jobTitle, location]);

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchSalaryData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!salaryData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No salary data available for this position.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          Salary Benchmarks
        </CardTitle>
        <CardDescription>
          Based on {salaryData.sample_size?.toLocaleString() || 'market'} data points for {jobTitle} in {location || 'US'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Median Salary Highlight */}
        <div className="text-center p-4 bg-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Median Salary</p>
          <p className="text-3xl font-bold text-primary">{formatSalary(salaryData.median_salary)}</p>
        </div>

        {/* Percentile Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">25th Percentile</p>
            <p className="font-semibold">{formatSalary(salaryData.percentile_25)}</p>
          </div>
          <div className="p-3 border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">50th Percentile</p>
            <p className="font-semibold">{formatSalary(salaryData.median_salary)}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">75th Percentile</p>
            <p className="font-semibold">{formatSalary(salaryData.percentile_75)}</p>
          </div>
        </div>

        {salaryData.percentile_90 && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm">Top 10% earn above</span>
            </div>
            <Badge variant="outline">{formatSalary(salaryData.percentile_90)}</Badge>
          </div>
        )}

        {/* Data Source Disclaimer */}
        <Alert className="bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Data sourced from {salaryData.source || 'market surveys'}. 
            Actual salaries may vary based on experience, skills, and company size. 
            Last updated: {salaryData.data_date ? new Date(salaryData.data_date).toLocaleDateString() : 'Recently'}
          </AlertDescription>
        </Alert>

        <Button variant="ghost" size="sm" className="w-full" onClick={fetchSalaryData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
};
