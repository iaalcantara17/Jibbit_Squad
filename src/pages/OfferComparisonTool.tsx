import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  DollarSign, 
  MapPin, 
  Heart, 
  Briefcase, 
  TrendingUp,
  Plus,
  Trash2,
  Calculator,
  Download,
  Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JobOffer {
  id: string;
  company_name: string;
  job_title: string;
  base_salary: number;
  bonus: number;
  equity_value: number;
  health_insurance_value: number;
  retirement_401k_match: number;
  pto_days: number;
  location: string;
  remote_policy: string;
  culture_score: number;
  growth_score: number;
  wlb_score: number;
  total_compensation: number;
  adjusted_compensation: number;
  weighted_score: number;
  status: string;
  decline_reason?: string;
}

const DEFAULT_WEIGHTS = {
  compensation: 40,
  culture: 20,
  growth: 20,
  workLifeBalance: 20
};

export default function OfferComparisonTool() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [scenarioAdjustment, setScenarioAdjustment] = useState(0);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    base_salary: 0,
    bonus: 0,
    equity_value: 0,
    health_insurance_value: 5000,
    retirement_401k_match: 0,
    pto_days: 15,
    location: '',
    remote_policy: 'hybrid',
    culture_score: 5,
    growth_score: 5,
    wlb_score: 5
  });

  const fetchOffers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate scores for each offer
      const scoredOffers = (data || []).map(offer => calculateOfferScore(offer));
      setOffers(scoredOffers);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const calculateOfferScore = (offer: any): JobOffer => {
    // Calculate total compensation
    const totalComp = (offer.base_salary || 0) + 
                      (offer.bonus || 0) + 
                      (offer.equity_value || 0) + 
                      (offer.health_insurance_value || 0) + 
                      (offer.retirement_401k_match || 0) +
                      ((offer.pto_days || 0) * 500); // Value PTO at ~$500/day

    // Cost of living adjustment (simplified)
    const colMultiplier = offer.location?.toLowerCase().includes('sf') || 
                          offer.location?.toLowerCase().includes('nyc') ? 0.75 : 1;
    const adjustedComp = totalComp * colMultiplier;

    // Calculate weighted score
    const maxComp = 500000; // Normalize against max expected compensation
    const compScore = (adjustedComp / maxComp) * 100;
    
    const weightedScore = (
      (compScore * weights.compensation / 100) +
      ((offer.culture_score || 5) * 10 * weights.culture / 100) +
      ((offer.growth_score || 5) * 10 * weights.growth / 100) +
      ((offer.wlb_score || 5) * 10 * weights.workLifeBalance / 100)
    );

    return {
      ...offer,
      total_compensation: totalComp,
      adjusted_compensation: adjustedComp,
      weighted_score: Math.round(weightedScore)
    };
  };

  const handleAddOffer = async () => {
    if (!user || !formData.company_name || !formData.base_salary) {
      toast.error('Company name and base salary are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('job_offers')
        .insert({
          user_id: user.id,
          ...formData,
          status: 'pending'
        });

      if (error) throw error;
      
      toast.success('Offer added');
      setShowAddForm(false);
      setFormData({
        company_name: '',
        job_title: '',
        base_salary: 0,
        bonus: 0,
        equity_value: 0,
        health_insurance_value: 5000,
        retirement_401k_match: 0,
        pto_days: 15,
        location: '',
        remote_policy: 'hybrid',
        culture_score: 5,
        growth_score: 5,
        wlb_score: 5
      });
      fetchOffers();
    } catch (err) {
      toast.error('Failed to add offer');
    }
  };

  const handleDeclineOffer = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('job_offers')
        .update({ status: 'declined', decline_reason: reason })
        .eq('id', id);

      if (error) throw error;
      toast.success('Offer archived');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to update offer');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Recalculate scores when weights change
  useEffect(() => {
    setOffers(prev => prev.map(offer => calculateOfferScore(offer)));
  }, [weights]);

  const activeOffers = offers.filter(o => o.status !== 'declined');
  const declinedOffers = offers.filter(o => o.status === 'declined');
  const sortedOffers = [...activeOffers].sort((a, b) => b.weighted_score - a.weighted_score);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <Scale className="h-10 w-10 text-primary" />
                Offer Comparison Tool
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Compare job offers across all dimensions
              </p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </Button>
          </div>

          {/* Add Offer Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input 
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input 
                      value={formData.job_title}
                      onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Salary *</Label>
                    <Input 
                      type="number"
                      value={formData.base_salary || ''}
                      onChange={(e) => setFormData({...formData, base_salary: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Bonus</Label>
                    <Input 
                      type="number"
                      value={formData.bonus || ''}
                      onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Equity Value (annual)</Label>
                    <Input 
                      type="number"
                      value={formData.equity_value || ''}
                      onChange={(e) => setFormData({...formData, equity_value: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>401k Match (annual)</Label>
                    <Input 
                      type="number"
                      value={formData.retirement_401k_match || ''}
                      onChange={(e) => setFormData({...formData, retirement_401k_match: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Health Insurance Value</Label>
                    <Input 
                      type="number"
                      value={formData.health_insurance_value || ''}
                      onChange={(e) => setFormData({...formData, health_insurance_value: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PTO Days</Label>
                    <Input 
                      type="number"
                      value={formData.pto_days || ''}
                      onChange={(e) => setFormData({...formData, pto_days: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Culture Fit (1-10)</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={10}
                      value={formData.culture_score}
                      onChange={(e) => setFormData({...formData, culture_score: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Growth Opportunity (1-10)</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={10}
                      value={formData.growth_score}
                      onChange={(e) => setFormData({...formData, growth_score: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Work-Life Balance (1-10)</Label>
                    <Input 
                      type="number"
                      min={1}
                      max={10}
                      value={formData.wlb_score}
                      onChange={(e) => setFormData({...formData, wlb_score: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddOffer}>Add Offer</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weights Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Scoring Weights
              </CardTitle>
              <CardDescription>Adjust how much each factor matters to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Compensation</Label>
                    <span className="text-sm text-muted-foreground">{weights.compensation}%</span>
                  </div>
                  <Slider 
                    value={[weights.compensation]} 
                    max={100}
                    step={5}
                    onValueChange={(v) => setWeights({...weights, compensation: v[0]})}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Culture</Label>
                    <span className="text-sm text-muted-foreground">{weights.culture}%</span>
                  </div>
                  <Slider 
                    value={[weights.culture]} 
                    max={100}
                    step={5}
                    onValueChange={(v) => setWeights({...weights, culture: v[0]})}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Growth</Label>
                    <span className="text-sm text-muted-foreground">{weights.growth}%</span>
                  </div>
                  <Slider 
                    value={[weights.growth]} 
                    max={100}
                    step={5}
                    onValueChange={(v) => setWeights({...weights, growth: v[0]})}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Work-Life Balance</Label>
                    <span className="text-sm text-muted-foreground">{weights.workLifeBalance}%</span>
                  </div>
                  <Slider 
                    value={[weights.workLifeBalance]} 
                    max={100}
                    step={5}
                    onValueChange={(v) => setWeights({...weights, workLifeBalance: v[0]})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Matrix */}
          {sortedOffers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Side-by-Side Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Criteria</th>
                        {sortedOffers.map((offer, idx) => (
                          <th key={offer.id} className="p-3 text-center min-w-[150px]">
                            <div className="space-y-1">
                              <p className="font-bold">{offer.company_name}</p>
                              <p className="text-sm text-muted-foreground">{offer.job_title}</p>
                              {idx === 0 && <Badge className="bg-success">Top Pick</Badge>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b bg-muted/30">
                        <td className="p-3 font-medium">Weighted Score</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            <span className="text-2xl font-bold text-primary">{offer.weighted_score}</span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Total Compensation</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center font-medium">
                            {formatCurrency(offer.total_compensation)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">COL-Adjusted</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {formatCurrency(offer.adjusted_compensation)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Base Salary</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {formatCurrency(offer.base_salary)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Location</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {offer.location || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">PTO Days</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {offer.pto_days || 0}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Culture Score</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {offer.culture_score}/10
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Growth Score</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {offer.growth_score}/10
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Work-Life Balance</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            {offer.wlb_score}/10
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3">Actions</td>
                        {sortedOffers.map(offer => (
                          <td key={offer.id} className="p-3 text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeclineOffer(offer.id, 'Declined')}
                            >
                              <Archive className="h-3 w-3 mr-1" />
                              Archive
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No offers to compare yet. Add your first offer!</p>
              </CardContent>
            </Card>
          )}

          {/* Scenario Analysis */}
          {sortedOffers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Analysis</CardTitle>
                <CardDescription>What if you negotiated a higher salary?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Salary Increase:</Label>
                    <Slider 
                      value={[scenarioAdjustment]} 
                      max={30}
                      step={5}
                      className="w-48"
                      onValueChange={(v) => setScenarioAdjustment(v[0])}
                    />
                    <span className="text-lg font-bold">+{scenarioAdjustment}%</span>
                  </div>
                  
                  {scenarioAdjustment > 0 && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {sortedOffers.slice(0, 3).map(offer => {
                        const newSalary = offer.base_salary * (1 + scenarioAdjustment / 100);
                        const newTotal = offer.total_compensation + (newSalary - offer.base_salary);
                        return (
                          <div key={offer.id} className="p-4 border rounded-lg">
                            <p className="font-medium">{offer.company_name}</p>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(offer.base_salary)}
                            </p>
                            <p className="text-lg font-bold text-success">
                              {formatCurrency(newSalary)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              New total: {formatCurrency(newTotal)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Declined Offers */}
          {declinedOffers.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-muted-foreground">Archived Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {declinedOffers.map(offer => (
                    <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{offer.company_name}</p>
                        <p className="text-sm text-muted-foreground">{offer.job_title}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatCurrency(offer.base_salary)}</p>
                        <Badge variant="secondary">{offer.decline_reason || 'Declined'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
