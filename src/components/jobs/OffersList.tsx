import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, DollarSign, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Offer {
  id: string;
  base_salary: number | null;
  bonus: number | null;
  equity: string | null;
  location: string | null;
  level: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface OffersListProps {
  jobId: string;
  onSelectOffer: (offerId: string) => void;
}

export const OffersList = ({ jobId, onSelectOffer }: OffersListProps) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    base_salary: "",
    bonus: "",
    equity: "",
    location: "",
    level: "",
    notes: "",
    status: "pending"
  });

  useEffect(() => {
    fetchOffers();
  }, [jobId]);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load offers");
      return;
    }

    setOffers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("offers").insert({
      user_id: user.id,
      job_id: jobId,
      base_salary: formData.base_salary ? parseFloat(formData.base_salary) : null,
      bonus: formData.bonus ? parseFloat(formData.bonus) : null,
      equity: formData.equity || null,
      location: formData.location || null,
      level: formData.level || null,
      notes: formData.notes || null,
      status: formData.status
    });

    if (error) {
      toast.error("Failed to create offer");
    } else {
      toast.success("Offer created successfully");
      setIsDialogOpen(false);
      setFormData({
        base_salary: "",
        bonus: "",
        equity: "",
        location: "",
        level: "",
        notes: "",
        status: "pending"
      });
      fetchOffers();
    }

    setIsLoading(false);
  };

  const handleDelete = async (offerId: string) => {
    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId);

    if (error) {
      toast.error("Failed to delete offer");
    } else {
      toast.success("Offer deleted");
      fetchOffers();
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "default";
      case "rejected": return "destructive";
      case "negotiating": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Offers</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_salary">Base Salary</Label>
                  <Input
                    id="base_salary"
                    type="number"
                    placeholder="120000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bonus">Bonus</Label>
                  <Input
                    id="bonus"
                    type="number"
                    placeholder="15000"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equity">Equity</Label>
                  <Input
                    id="equity"
                    placeholder="50,000 RSUs"
                    value={formData.equity}
                    onChange={(e) => setFormData({ ...formData, equity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    placeholder="Senior Engineer"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional details about the offer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Offer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No offers yet</p>
            <p className="text-sm text-muted-foreground">Add an offer to start negotiation prep</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {offer.level || "Position"} {offer.location && `• ${offer.location}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(offer.status)}>
                        {offer.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(offer.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Base Salary</p>
                    <p className="font-semibold">{formatCurrency(offer.base_salary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bonus</p>
                    <p className="font-semibold">{formatCurrency(offer.bonus)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Equity</p>
                    <p className="font-semibold">{offer.equity || "Not specified"}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => onSelectOffer(offer.id)} 
                  className="w-full"
                  variant="outline"
                >
                  View Negotiation Prep
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
