import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Target,
  Clock,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface CareerPath {
  year: number;
  title: string;
  salary_low: number;
  salary_mid: number;
  salary_high: number;
  probability: number;
}

interface SimulationResult {
  paths: CareerPath[];
  lifetime_earnings_low: number;
  lifetime_earnings_mid: number;
  lifetime_earnings_high: number;
  success_probability: number;
  key_milestones: Array<{ year: number; event: string }>;
  risk_factors: string[];
}

export default function CareerPathSimulation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [timeHorizon, setTimeHorizon] = useState(5);

  const [formData, setFormData] = useState({
    current_role: '',
    current_salary: 75000,
    target_role: '',
    target_salary: 150000,
    industry: 'Technology'
  });

  const runSimulation = async () => {
    if (!formData.current_role) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('career-simulation', {
        body: {
          currentRole: formData.current_role,
          currentSalary: formData.current_salary,
          targetRole: formData.target_role,
          targetSalary: formData.target_salary,
          industry: formData.industry,
          timeHorizonYears: timeHorizon
        }
      });

      if (error) throw error;

      if (data?.simulation) {
        setSimulation(data.simulation);
      } else {
        // Generate demo simulation
        const paths: CareerPath[] = [];
        let currentSalary = formData.current_salary;
        const annualGrowth = 0.08;

        for (let year = 1; year <= timeHorizon; year++) {
          const baseSalary = currentSalary * Math.pow(1 + annualGrowth, year);
          paths.push({
            year,
            title: year < 3 ? formData.current_role : (year < 5 ? 'Senior ' + formData.current_role : formData.target_role || 'Director'),
            salary_low: Math.round(baseSalary * 0.85),
            salary_mid: Math.round(baseSalary),
            salary_high: Math.round(baseSalary * 1.2),
            probability: Math.max(20, 95 - year * 10)
          });
        }

        setSimulation({
          paths,
          lifetime_earnings_low: paths.reduce((sum, p) => sum + p.salary_low, 0),
          lifetime_earnings_mid: paths.reduce((sum, p) => sum + p.salary_mid, 0),
          lifetime_earnings_high: paths.reduce((sum, p) => sum + p.salary_high, 0),
          success_probability: 75,
          key_milestones: [
            { year: 2, event: 'Promotion to Senior level' },
            { year: 4, event: 'Management opportunity' },
            { year: 5, event: 'Director/Lead role' }
          ],
          risk_factors: [
            'Economic downturn could slow advancement',
            'Industry disruption may require reskilling',
            'Competition for senior roles is high'
          ]
        });
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold flex items-center gap-3">
              <TrendingUp className="h-10 w-10 text-primary" />
              Career Path Simulation
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Simulate your career trajectory and make strategic decisions
            </p>
          </div>

          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Simulation Parameters</CardTitle>
              <CardDescription>Enter your current situation and goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Role</Label>
                    <Input 
                      placeholder="e.g., Software Engineer"
                      value={formData.current_role}
                      onChange={(e) => setFormData({...formData, current_role: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Salary</Label>
                    <Input 
                      type="number"
                      value={formData.current_salary}
                      onChange={(e) => setFormData({...formData, current_salary: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input 
                      placeholder="e.g., Technology"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Role (optional)</Label>
                    <Input 
                      placeholder="e.g., Engineering Director"
                      value={formData.target_role}
                      onChange={(e) => setFormData({...formData, target_role: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Salary</Label>
                    <Input 
                      type="number"
                      value={formData.target_salary}
                      onChange={(e) => setFormData({...formData, target_salary: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Time Horizon</Label>
                      <span className="text-sm text-muted-foreground">{timeHorizon} years</span>
                    </div>
                    <Slider 
                      value={[timeHorizon]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(v) => setTimeHorizon(v[0])}
                    />
                  </div>
                </div>
              </div>
              <Button className="mt-6" onClick={runSimulation} disabled={loading || !formData.current_role}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Simulation Results */}
          {simulation && (
            <>
              {/* Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Success Probability</p>
                        <p className="text-3xl font-bold text-primary">{simulation.success_probability}%</p>
                      </div>
                      <Target className="h-8 w-8 text-primary opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{timeHorizon}-Year Earnings (Low)</p>
                        <p className="text-2xl font-bold">{formatCurrency(simulation.lifetime_earnings_low)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{timeHorizon}-Year Earnings (Mid)</p>
                        <p className="text-2xl font-bold text-success">{formatCurrency(simulation.lifetime_earnings_mid)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-success opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{timeHorizon}-Year Earnings (High)</p>
                        <p className="text-2xl font-bold">{formatCurrency(simulation.lifetime_earnings_high)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Projection Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Salary Projection</CardTitle>
                  <CardDescription>Expected salary range over {timeHorizon} years</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simulation.paths}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: 'Year', position: 'bottom' }} />
                        <YAxis 
                          tickFormatter={(v) => `$${(v/1000)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="salary_high" 
                          stackId="1"
                          stroke="hsl(var(--success))" 
                          fill="hsl(var(--success))"
                          fillOpacity={0.2}
                          name="Best Case"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="salary_mid" 
                          stackId="2"
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                          name="Expected"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="salary_low" 
                          stackId="3"
                          stroke="hsl(var(--muted-foreground))" 
                          fill="hsl(var(--muted))"
                          fillOpacity={0.3}
                          name="Conservative"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Career Path Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Career Path Timeline</CardTitle>
                  <CardDescription>Projected role progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                        0
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{formData.current_role}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(formData.current_salary)}</p>
                      </div>
                      <Badge>Current</Badge>
                    </div>

                    {simulation.paths.map((path, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                          {path.year}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{path.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(path.salary_low)} - {formatCurrency(path.salary_high)}
                          </p>
                        </div>
                        <Badge variant="outline">{path.probability}% likely</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Milestones & Risk Factors */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Key Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {simulation.key_milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                          <Badge variant="secondary">Year {milestone.year}</Badge>
                          <span className="text-sm">{milestone.event}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning">
                      <Briefcase className="h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {simulation.risk_factors.map((risk, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-warning">•</span>
                          {risk}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
