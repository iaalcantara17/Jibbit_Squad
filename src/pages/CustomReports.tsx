import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Download, Save, FileText, Edit, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  calculateApplicationsSent,
  calculateInterviewsScheduled,
  calculateOffersReceived,
  calculateConversionRates,
  filterJobsByDateRange,
  filterJobsByCompany,
} from "@/lib/analyticsService";
import jsPDF from "jspdf";

const AVAILABLE_METRICS = [
  { id: "applications_sent", label: "Applications Sent" },
  { id: "interviews_scheduled", label: "Interviews Scheduled" },
  { id: "offers_received", label: "Offers Received" },
  { id: "conversion_rate", label: "Conversion Rate" },
  { id: "response_rate", label: "Response Rate" },
  { id: "avg_time_to_response", label: "Avg Time to Response" },
];

export default function CustomReports() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    metrics: [] as string[],
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("custom_report_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("custom_report_templates").insert([
        {
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          metrics: formData.metrics,
          filters: {
            date_range: {
              start: formData.startDate?.toISOString(),
              end: formData.endDate?.toISOString(),
            },
          },
        },
      ]);

      if (error) throw error;
      toast.success("Template saved!");
      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleGenerateReport = async (template?: any) => {
    setGeneratingReport(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const metricsToUse = template ? template.metrics : formData.metrics;
      const startDate = template?.filters?.date_range?.start
        ? new Date(template.filters.date_range.start)
        : formData.startDate;
      const endDate = template?.filters?.date_range?.end
        ? new Date(template.filters.date_range.end)
        : formData.endDate;

      // Fetch data
      const [
        { data: jobsData },
        { data: interviewsData },
      ] = await Promise.all([
        supabase.from("jobs").select("*").eq("user_id", user.id).eq("is_archived", false),
        supabase.from("interviews").select("*").eq("user_id", user.id),
      ]);

      let filteredJobs = jobsData || [];
      filteredJobs = filterJobsByDateRange(filteredJobs, startDate, endDate);

      // Calculate selected metrics
      const metrics: any = {};
      if (metricsToUse.includes("applications_sent")) {
        metrics.applications_sent = calculateApplicationsSent(filteredJobs);
      }
      if (metricsToUse.includes("interviews_scheduled")) {
        metrics.interviews_scheduled = calculateInterviewsScheduled(interviewsData || []);
      }
      if (metricsToUse.includes("offers_received")) {
        metrics.offers_received = calculateOffersReceived(filteredJobs);
      }
      if (metricsToUse.includes("conversion_rate")) {
        metrics.conversion_rate = calculateConversionRates(filteredJobs);
      }

      setReportData({
        metrics,
        dateRange: { start: startDate, end: endDate },
        generatedAt: new Date(),
      });

      toast.success("Report generated!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const rows = [
      ["Metric", "Value"],
      ...Object.entries(reportData.metrics).map(([key, value]) => {
        if (key === "conversion_rate") {
          const rates = value as any;
          return [
            "Conversion Rates",
            `Applied→Interview: ${rates.appliedToInterview}%, Interview→Offer: ${rates.interviewToOffer}%, Applied→Offer: ${rates.appliedToOffer}%`,
          ];
        }
        return [key.replace(/_/g, " "), String(value)];
      }),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
    toast.success("CSV exported!");
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Custom Analytics Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated: ${reportData.generatedAt.toLocaleString()}`, 20, 30);

    if (reportData.dateRange.start || reportData.dateRange.end) {
      const range = `Date Range: ${reportData.dateRange.start?.toLocaleDateString() || "Any"} - ${reportData.dateRange.end?.toLocaleDateString() || "Any"}`;
      doc.text(range, 20, 40);
    }

    let yPos = 55;
    doc.text("Metrics:", 20, yPos);
    yPos += 10;

    Object.entries(reportData.metrics).forEach(([key, value]) => {
      const label = key.replace(/_/g, " ");
      if (key === "conversion_rate") {
        const rates = value as any;
        doc.text(`${label}:`, 20, yPos);
        yPos += 7;
        doc.text(`  Applied→Interview: ${rates.appliedToInterview}%`, 20, yPos);
        yPos += 7;
        doc.text(`  Interview→Offer: ${rates.interviewToOffer}%`, 20, yPos);
        yPos += 7;
        doc.text(`  Applied→Offer: ${rates.appliedToOffer}%`, 20, yPos);
      } else {
        doc.text(`${label}: ${value}`, 20, yPos);
      }
      yPos += 10;
    });

    doc.save(`report-${Date.now()}.pdf`);
    toast.success("PDF exported!");
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const { error } = await supabase.from("custom_report_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Template deleted");
      loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Application Summary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Metrics</Label>
                  <div className="space-y-2">
                    {AVAILABLE_METRICS.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.metrics.includes(metric.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, metrics: [...formData.metrics, metric.id] });
                            } else {
                              setFormData({ ...formData, metrics: formData.metrics.filter((m) => m !== metric.id) });
                            }
                          }}
                        />
                        <Label>{metric.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left", !formData.startDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, startDate: date || null })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left", !formData.endDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateReport()} disabled={formData.metrics.length === 0} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveTemplate}
                    disabled={!formData.name || formData.metrics.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Custom reports</strong> let you select specific metrics and date ranges. Save templates for recurring
            reports and export to CSV or PDF.
          </AlertDescription>
        </Alert>

        {/* Generated Report */}
        {reportData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Report</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Generated: {reportData.generatedAt.toLocaleString()}
                </div>
                {(reportData.dateRange.start || reportData.dateRange.end) && (
                  <div className="text-sm text-muted-foreground">
                    Date Range: {reportData.dateRange.start?.toLocaleDateString() || "Any"} -{" "}
                    {reportData.dateRange.end?.toLocaleDateString() || "Any"}
                  </div>
                )}
                <div className="border-t pt-4 space-y-3">
                  {Object.entries(reportData.metrics).map(([key, value]) => {
                    if (key === "conversion_rate") {
                      const rates = value as any;
                      return (
                        <div key={key} className="space-y-2">
                          <div className="font-medium">Conversion Rates</div>
                          <div className="pl-4 space-y-1 text-sm">
                            <div>Applied → Interview: {rates.appliedToInterview}%</div>
                            <div>Interview → Offer: {rates.interviewToOffer}%</div>
                            <div>Applied → Offer: {rates.appliedToOffer}%</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key.replace(/_/g, " ")}</span>
                        <span>{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved templates yet. Create a report and save it as a template for easy reuse.
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {template.metrics.map((m: string) => (
                          <Badge key={m} variant="outline">
                            {AVAILABLE_METRICS.find((am) => am.id === m)?.label || m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReport(template)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
