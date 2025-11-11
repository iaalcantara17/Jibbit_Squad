import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  Briefcase,
  Building,
  Clock,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  FileText
} from "lucide-react";
import { JobMatchScore } from "./JobMatchScore";
import { SkillsGapAnalysis } from "./SkillsGapAnalysis";
import { SalaryResearch } from "./SalaryResearch";
import { InterviewInsights } from "./InterviewInsights";
import { CompanyResearch } from "./CompanyResearch";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { CompanyNewsSection } from "./CompanyNewsSection";
import { InterviewScheduler, InterviewData } from "./InterviewScheduler";
import { ApplicationMaterialsDialog } from "./ApplicationMaterialsDialog";
import { format } from "date-fns";
import { Job, JobContact } from "@/types/jobs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useInterviews } from "@/hooks/useInterviews";

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const JobDetailsModal = ({ job, isOpen, onClose, onUpdate }: JobDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedJob, setEditedJob] = useState<Partial<Job>>({});
  const [newContact, setNewContact] = useState<JobContact>({});
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);
  const { interviews, createInterview, deleteInterview, loading: interviewsLoading } = useInterviews(job?.id);

  if (!job) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.jobs.update(job.job_id, editedJob);
      toast.success("Job updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("An error occurred while updating the job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!newContact.name) {
      toast.error("Contact name is required");
      return;
    }

    const updatedContacts = [...(editedJob.contacts || job.contacts || []), newContact];
    setEditedJob({ ...editedJob, contacts: updatedContacts });
    setNewContact({});
  };

  const handleDeleteContact = (index: number) => {
    const updatedContacts = (editedJob.contacts || job.contacts || []).filter((_, i) => i !== index);
    setEditedJob({ ...editedJob, contacts: updatedContacts });
  };

  const handleScheduleInterview = async (interviewData: InterviewData) => {
    const interviewDateTime = new Date(interviewData.date);
    const [hours, minutes] = interviewData.time.split(':');
    interviewDateTime.setHours(parseInt(hours), parseInt(minutes));

    await createInterview({
      job_id: job.id,
      interview_type: interviewData.type,
      interview_date: interviewDateTime.toISOString(),
      location: interviewData.location,
      interviewer_name: interviewData.interviewers,
      notes: interviewData.notes,
    });
  };

  const statusColors: Record<string, string> = {
    'Interested': 'bg-muted text-muted-foreground',
    'Applied': 'bg-primary/10 text-primary',
    'Phone Screen': 'bg-accent/10 text-accent',
    'Interview': 'bg-warning/10 text-warning',
    'Offer': 'bg-success/10 text-success',
    'Rejected': 'bg-destructive/10 text-destructive',
  };

  const displayJob = isEditing ? { ...job, ...editedJob } : job;
  const companyName = typeof displayJob.company === 'string' ? displayJob.company : displayJob.company?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-display">
                {displayJob.jobTitle || displayJob.title}
              </DialogTitle>
              <p className="text-muted-foreground mt-1">{companyName}</p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge className={statusColors[displayJob.status]}>
                {displayJob.status}
              </Badge>
            </div>
            
            {displayJob.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{displayJob.location}</span>
              </div>
            )}

            {(displayJob.salaryMin || displayJob.salaryMax) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  {displayJob.salaryMin && displayJob.salaryMax
                    ? `$${displayJob.salaryMin.toLocaleString()} - $${displayJob.salaryMax.toLocaleString()}`
                    : displayJob.salaryMin
                    ? `$${displayJob.salaryMin.toLocaleString()}+`
                    : `Up to $${displayJob.salaryMax?.toLocaleString()}`}
                </span>
              </div>
            )}

            {displayJob.jobType && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{displayJob.jobType}</span>
              </div>
            )}
          </div>

          {displayJob.applicationDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {format(new Date(displayJob.applicationDeadline), "PPP")}</span>
            </div>
          )}

          {displayJob.jobUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(displayJob.jobUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Job Posting
            </Button>
          )}

          <Separator />

          {/* Tabbed Content */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full flex flex-wrap gap-1 h-auto justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="match">Match</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="prep">Prep</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editedJob.jobDescription ?? displayJob.jobDescription ?? ""}
                    onChange={(e) => setEditedJob({ ...editedJob, jobDescription: e.target.value })}
                    rows={10}
                    placeholder="Enter job description..."
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {displayJob.jobDescription || "No description available"}
                  </div>
                )}
              </div>

              {typeof displayJob.company !== 'string' && displayJob.company?.description && (
                <div>
                  <h3 className="font-semibold mb-2">About the Company</h3>
                  <p className="text-sm text-muted-foreground">
                    {displayJob.company.description}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div>
                <Label>General Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob.notes ?? displayJob.notes ?? ""}
                    onChange={(e) => setEditedJob({ ...editedJob, notes: e.target.value })}
                    rows={6}
                    placeholder="Add your notes about this job..."
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[100px] p-3 border rounded-md">
                    {displayJob.notes || "No notes added yet"}
                  </div>
                )}
              </div>

              <div>
                <Label>Salary Negotiation Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob.salaryNegotiationNotes ?? displayJob.salaryNegotiationNotes ?? ""}
                    onChange={(e) => setEditedJob({ ...editedJob, salaryNegotiationNotes: e.target.value })}
                    rows={4}
                    placeholder="Notes about salary discussions..."
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[80px] p-3 border rounded-md">
                    {displayJob.salaryNegotiationNotes || "No salary notes yet"}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Application Materials</h3>
                  <Button size="sm" onClick={() => setShowMaterialsDialog(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Materials
                  </Button>
                </div>

                <div className="grid gap-4">
                  {/* Resume Info */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Resume</h4>
                    </div>
                    {displayJob.resume_id ? (
                      <div className="text-sm text-muted-foreground">
                        Resume attached
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No resume selected
                      </div>
                    )}
                  </div>

                  {/* Cover Letter Info */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Cover Letter</h4>
                    </div>
                    {displayJob.cover_letter_id ? (
                      <div className="text-sm text-muted-foreground">
                        Cover letter attached
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No cover letter selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              {isEditing && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">Add New Contact</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Name *"
                      value={newContact.name || ""}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <Input
                      placeholder="Role (e.g., Recruiter)"
                      value={newContact.role || ""}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newContact.email || ""}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    />
                    <Input
                      placeholder="Phone"
                      value={newContact.phone || ""}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                  </div>
                  <Button size="sm" onClick={handleAddContact}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {(editedJob.contacts || displayJob.contacts || []).map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{contact.name}</h4>
                        {contact.role && (
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        )}
                        {contact.email && (
                          <p className="text-sm">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-sm">{contact.phone}</p>
                        )}
                        {contact.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{contact.notes}</p>
                        )}
                      </div>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(!displayJob.contacts || displayJob.contacts.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contacts added yet
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <InterviewScheduler
                jobId={job.id}
                jobTitle={displayJob.jobTitle || displayJob.title || ''}
                companyName={companyName || ''}
                onSchedule={handleScheduleInterview}
              />
              
              {interviewsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading interviews...</p>
              ) : interviews.length > 0 ? (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold">Scheduled Interviews</h3>
                  {interviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{interview.interview_type}</Badge>
                            <span className="text-sm">
                              {format(new Date(interview.interview_date), "PPP 'at' p")}
                            </span>
                          </div>
                          {interview.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {interview.location}
                            </p>
                          )}
                          {interview.interviewer_name && (
                            <p className="text-sm">Interviewer: {interview.interviewer_name}</p>
                          )}
                          {interview.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{interview.notes}</p>
                          )}
                          {interview.calendar_event_id && (
                            <Badge variant="secondary" className="mt-2">
                              <Calendar className="h-3 w-3 mr-1" />
                              Synced to Calendar
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInterview(interview.id, interview.calendar_event_id || undefined)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interviews scheduled yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="interview" className="space-y-4">
              <div>
                <Label>Interview Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob.interviewNotes ?? displayJob.interviewNotes ?? ""}
                    onChange={(e) => setEditedJob({ ...editedJob, interviewNotes: e.target.value })}
                    rows={8}
                    placeholder="Track interview questions, observations, and feedback..."
                  />
                ) : (
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                    {displayJob.interviewNotes || "No interview notes yet"}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="match">
              <JobMatchScore jobId={job.id} />
            </TabsContent>

            <TabsContent value="skills">
              <SkillsGapAnalysis jobId={job.id} />
            </TabsContent>

            <TabsContent value="salary">
              <SalaryResearch jobId={job.id} />
            </TabsContent>

            <TabsContent value="prep">
              <InterviewInsights jobId={job.id} />
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              <CompanyResearch jobId={job.id} />
              
              {typeof displayJob.company !== 'string' && displayJob.company && (
                <>
                  <CompanyInfoSection company={displayJob.company} />
                  {displayJob.company.recentNews && displayJob.company.recentNews.length > 0 && (
                    <CompanyNewsSection 
                      companyName={displayJob.company.name} 
                      news={displayJob.company.recentNews} 
                    />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {displayJob.statusHistory && displayJob.statusHistory.length > 0 ? (
                displayJob.statusHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 border-l-2 pl-3">
                    <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[entry.status]}>
                          {entry.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.changedAt), "PPP 'at' p")}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No status history available
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Application Materials Dialog */}
      <ApplicationMaterialsDialog
        jobId={job.id}
        currentResumeId={job.resume_id}
        currentCoverLetterId={job.cover_letter_id}
        isOpen={showMaterialsDialog}
        onClose={() => setShowMaterialsDialog(false)}
        onUpdate={onUpdate}
      />
    </Dialog>
  );
};
