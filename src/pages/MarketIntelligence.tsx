import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ExternalLink, TrendingUp, Tag, MapPin, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface MarketNote {
  id: string;
  title: string;
  url: string | null;
  summary: string | null;
  tags: string[];
  industry: string | null;
  location: string | null;
  skills: string[];
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function MarketIntelligence() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    summary: "",
    tags: "",
    industry: "",
    location: "",
    skills: "",
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["market-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketNote[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (note: Partial<MarketNote>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("market_notes").insert([{
        user_id: user.id,
        title: note.title!,
        url: note.url || null,
        summary: note.summary || null,
        tags: note.tags || [],
        industry: note.industry || null,
        location: note.location || null,
        skills: note.skills || [],
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-notes"] });
      toast.success("Market note saved");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        url: "",
        summary: "",
        tags: "",
        industry: "",
        location: "",
        skills: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to save note: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: formData.title,
      url: formData.url || null,
      summary: formData.summary || null,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      industry: formData.industry || null,
      location: formData.location || null,
      skills: formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    });
  };

  // Aggregate data for trends
  const tagCounts = notes.reduce((acc, note) => {
    note.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const tagData = Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const skillCounts = notes.reduce((acc, note) => {
    note.skills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const skillData = Object.entries(skillCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const industryData = notes.reduce((acc, note) => {
    if (note.industry) {
      acc[note.industry] = (acc[note.industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const industryChartData = Object.entries(industryData).map(([name, value]) => ({ name, value }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Market Intelligence</h1>
          <p className="text-muted-foreground">Curate and analyze your own market research</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Market Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Market Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="hiring-freeze, remote-first, AI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="skills">Skills Mentioned (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, Python, Leadership"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">What This Means</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Save articles, job postings, and insights you find during your search. Tag and categorize them to spot
            emerging trends in your saved research. All data below reflects only what you've curated—no external
            sources or anonymous benchmarks.
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your market notes...</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No market notes yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your market intelligence by saving insights you discover
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
                <CardDescription>Most frequently used tags in your notes</CardDescription>
              </CardHeader>
              <CardContent>
                {tagData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tagData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No tags yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industries Mentioned</CardTitle>
                <CardDescription>Distribution of industries in your notes</CardDescription>
              </CardHeader>
              <CardContent>
                {industryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={industryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {industryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No industries specified yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Skills</CardTitle>
                <CardDescription>Most mentioned skills in your research</CardDescription>
              </CardHeader>
              <CardContent>
                {skillData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skillData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm">No skills mentioned yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Notes Timeline</CardTitle>
                <CardDescription>Total notes saved: {notes.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notes.length}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Insights collected across {new Set(notes.map(n => n.industry).filter(Boolean)).size} industries
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Market Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{note.title}</h3>
                    {note.url && (
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {note.summary && <p className="text-sm text-muted-foreground">{note.summary}</p>}
                  <div className="flex flex-wrap gap-2">
                    {note.industry && (
                      <Badge variant="outline">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {note.industry}
                      </Badge>
                    )}
                    {note.location && (
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {note.location}
                      </Badge>
                    )}
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
