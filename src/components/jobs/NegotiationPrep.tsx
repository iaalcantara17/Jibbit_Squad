import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, Target, MessageSquare, CheckCircle2, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Offer {
  id: string;
  base_salary: number | null;
  bonus: number | null;
  equity: string | null;
  location: string | null;
  level: string | null;
  notes: string | null;
  status: string;
  market_data: {
    min: number | null;
    max: number | null;
    sources: { title: string; url: string }[];
  };
  confidence_checklist: {
    researched_market: boolean;
    practiced_scripts: boolean;
    identified_leverage: boolean;
    set_walkaway: boolean;
    prepared_questions: boolean;
  };
}

interface NegotiationPrepProps {
  offerId: string;
  onBack: () => void;
}

export const NegotiationPrep = ({ offerId, onBack }: NegotiationPrepProps) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState("");
  const [marketMin, setMarketMin] = useState("");
  const [marketMax, setMarketMax] = useState("");
  const [newSource, setNewSource] = useState({ title: "", url: "" });

  useEffect(() => {
    fetchOffer();
  }, [offerId]);

  const fetchOffer = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error) {
      toast.error("Failed to load offer");
      return;
    }

    setOffer(data as any);
    const marketData = data.market_data as Offer["market_data"];
    setMarketMin(marketData?.min?.toString() || "");
    setMarketMax(marketData?.max?.toString() || "");
  };

  const updateMarketData = async () => {
    if (!offer) return;
    setIsLoading(true);

    const { error } = await supabase
      .from("offers")
      .update({
        market_data: {
          ...offer.market_data,
          min: marketMin ? parseFloat(marketMin) : null,
          max: marketMax ? parseFloat(marketMax) : null
        }
      })
      .eq("id", offerId);

    if (error) {
      toast.error("Failed to update market data");
    } else {
      toast.success("Market data updated");
      fetchOffer();
    }
    setIsLoading(false);
  };

  const addSource = async () => {
    if (!offer || !newSource.title || !newSource.url) return;
    setIsLoading(true);

    const { error } = await supabase
      .from("offers")
      .update({
        market_data: {
          ...offer.market_data,
          sources: [...(offer.market_data?.sources || []), newSource]
        }
      })
      .eq("id", offerId);

    if (error) {
      toast.error("Failed to add source");
    } else {
      toast.success("Source added");
      setNewSource({ title: "", url: "" });
      fetchOffer();
    }
    setIsLoading(false);
  };

  const toggleChecklistItem = async (key: keyof Offer["confidence_checklist"]) => {
    if (!offer) return;

    const { error } = await supabase
      .from("offers")
      .update({
        confidence_checklist: {
          ...offer.confidence_checklist,
          [key]: !offer.confidence_checklist[key]
        }
      })
      .eq("id", offerId);

    if (error) {
      toast.error("Failed to update checklist");
    } else {
      fetchOffer();
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotalComp = () => {
    if (!offer) return 0;
    const base = offer.base_salary || 0;
    const bonus = offer.bonus || 0;
    return base + bonus;
  };

  const getMarketPositioning = () => {
    if (!offer || !offer.market_data?.min || !offer.market_data?.max) {
      return { percentage: null, position: "No market data" };
    }

    const total = calculateTotalComp();
    const min = offer.market_data.min;
    const max = offer.market_data.max;
    const range = max - min;
    const position = ((total - min) / range) * 100;

    let positionText = "";
    if (position < 25) positionText = "Below market";
    else if (position < 50) positionText = "Lower market";
    else if (position < 75) positionText = "Mid market";
    else positionText = "Upper market";

    return { percentage: position, position: positionText };
  };

  const scripts = {
    initial: `Thank you for the offer. I'm excited about the opportunity to join [Company] as [Level]. Based on my research of market rates for this position in [Location], particularly for someone with my [X years] experience in [key skills], I was expecting a compensation package in the range of [target range].\n\nGiven my background in [specific achievements] and the value I can bring to [specific company initiatives], I'd like to discuss adjusting the base salary to [target number].`,
    
    counteroffer: `I appreciate you coming back with [revised offer]. While this is closer to my expectations, I'd like to propose [your counter]. Here's my reasoning:\n\n1. [Key accomplishment/skill]\n2. [Market data point]\n3. [Unique value proposition]\n\nIs there flexibility to meet at [specific number]?`,
    
    stalling: `Thank you for the offer. I'm very interested in the position and want to give this the consideration it deserves. Would it be possible to have until [specific date] to review the details and get back to you? This will allow me to [legitimate reason: discuss with family/review other options/etc.].`,
    
    competing: `I wanted to be transparent with you - I have another offer that I'm considering. However, [Company] remains my top choice because of [specific reasons: team/mission/growth opportunity]. The other offer includes [relevant details without specifics]. Is there any flexibility in your offer to help me make this decision?`
  };

  const checklistItems = [
    { key: "researched_market" as const, label: "Researched market rates for my role and location" },
    { key: "practiced_scripts" as const, label: "Practiced negotiation scripts and responses" },
    { key: "identified_leverage" as const, label: "Identified my unique value and leverage points" },
    { key: "set_walkaway" as const, label: "Set my walk-away number and priorities" },
    { key: "prepared_questions" as const, label: "Prepared questions about benefits, equity, and growth" }
  ];

  if (!offer) return <div>Loading...</div>;

  const marketPosition = getMarketPositioning();
  const completionRate = (Object.values(offer.confidence_checklist).filter(Boolean).length / 5) * 100;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Offers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Offer Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Base Salary</p>
              <p className="text-xl font-semibold">{formatCurrency(offer.base_salary)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bonus</p>
              <p className="text-xl font-semibold">{formatCurrency(offer.bonus)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cash</p>
              <p className="text-xl font-semibold">{formatCurrency(calculateTotalComp())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equity</p>
              <p className="text-xl font-semibold">{offer.equity || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="talking">Talking Points</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Positioning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="market_min">Market Min</Label>
                  <Input
                    id="market_min"
                    type="number"
                    placeholder="100000"
                    value={marketMin}
                    onChange={(e) => setMarketMin(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="market_max">Market Max</Label>
                  <Input
                    id="market_max"
                    type="number"
                    placeholder="150000"
                    value={marketMax}
                    onChange={(e) => setMarketMax(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={updateMarketData} disabled={isLoading}>
                Update Market Range
              </Button>

              {marketPosition.percentage !== null && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Your Offer Position</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${marketPosition.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(offer.market_data?.min || 0)}</span>
                        <span>{formatCurrency(offer.market_data?.max || 0)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{marketPosition.position}</p>
                      <p className="text-sm text-muted-foreground">{marketPosition.percentage.toFixed(0)}th percentile</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Research Sources</Label>
                {offer.market_data?.sources?.map((source, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                      {source.title}
                    </a>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Source title"
                    value={newSource.title}
                    onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  />
                  <Input
                    placeholder="URL"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  />
                </div>
                <Button onClick={addSource} variant="outline" disabled={isLoading}>
                  Add Source
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          {Object.entries(scripts).map(([key, script]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{key.replace('_', ' ')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={script}
                  readOnly
                  className="min-h-[150px] font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(script);
                    toast.success("Script copied to clipboard");
                  }}
                  variant="outline"
                  className="mt-2"
                >
                  Copy Script
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="talking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Talking Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-medium">Suggested topics to prepare:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Specific achievements from past roles with metrics</li>
                  <li>Unique skills or certifications that add value</li>
                  <li>Industry knowledge or domain expertise</li>
                  <li>Leadership or mentorship experience</li>
                  <li>How you'll contribute to company goals</li>
                </ul>
              </div>
              <Textarea
                placeholder="Write your key talking points here... (e.g., 'Led team that increased revenue by 40%', 'Expert in X technology with 5+ years', etc.)"
                value={talkingPoints}
                onChange={(e) => setTalkingPoints(e.target.value)}
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Confidence Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Preparation Progress</p>
                  <p className="text-sm font-semibold">{completionRate.toFixed(0)}%</p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.key} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Checkbox
                      checked={offer.confidence_checklist[item.key]}
                      onCheckedChange={() => toggleChecklistItem(item.key)}
                      className="mt-1"
                    />
                    <label className="text-sm flex-1 cursor-pointer" onClick={() => toggleChecklistItem(item.key)}>
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
