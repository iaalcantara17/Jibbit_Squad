import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Search, Save } from "lucide-react";
import { JobStatus, JobType, JobFilters as JobFiltersType } from "@/types/jobs";
import { SavedSearchesDialog } from "./SavedSearchesDialog";
import { JOB_STATUS, STATUS_LABELS, getStatusLabel, PIPELINE_STAGES } from '@/lib/constants/jobStatus';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: JobFiltersType) => void;
  onClearFilters: () => void;
}

const JOB_STATUSES: JobStatus[] = [
  JOB_STATUS.INTERESTED,
  JOB_STATUS.APPLIED,
  JOB_STATUS.PHONE_SCREEN,
  JOB_STATUS.INTERVIEW,
  JOB_STATUS.OFFER,
  JOB_STATUS.REJECTED,
];

const JOB_TYPES: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Added" },
  { value: "applicationDeadline", label: "Deadline" },
  { value: "jobTitle", label: "Job Title" },
  { value: "company.name", label: "Company" },
  { value: "salaryMax", label: "Salary" },
];

export const JobFilters = ({ filters, onFiltersChange, onClearFilters }: JobFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    filters.status ? [filters.status] : []
  );

  const hasActiveFilters = 
    filters.search || 
    filters.status || 
    filters.salaryMin !== undefined ||
    filters.salaryMax !== undefined ||
    filters.deadlineFrom !== undefined ||
    filters.deadlineTo !== undefined ||
    filters.isArchived !== undefined || 
    filters.sortBy;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleFilterChange = (key: keyof JobFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(newStatuses);
    // For now, only support single status until backend supports array
    onFiltersChange({ ...filters, status: (newStatuses[0] as JobStatus) || undefined });
  };

  return (
    <div className="flex gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs by title, company, or location..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Saved Searches Button */}
      <Button 
        variant="outline"
        onClick={() => setSavedSearchesOpen(true)}
      >
        <Save className="h-4 w-4 mr-2" />
        Saved Searches
      </Button>

      {/* Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter Jobs</SheetTitle>
            <SheetDescription>
              Refine your job search with these filters
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Status Filter - Multi-select */}
            <div className="space-y-3">
              <Label>Status (Select Multiple)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${stage.id}`}
                      checked={selectedStatuses.includes(stage.id)}
                      onCheckedChange={() => handleStatusToggle(stage.id)}
                    />
                    <Label
                      htmlFor={`status-${stage.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {stage.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedStatuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStatuses([]);
                    handleFilterChange("status", undefined);
                  }}
                  className="h-7 text-xs"
                >
                  Clear Status Filters
                </Button>
              )}
            </div>

            {/* Salary Range Filter */}
            <div className="space-y-3">
              <Label>Salary Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="salaryMin" className="text-xs text-muted-foreground">
                    Min ($)
                  </Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="e.g., 50000"
                    value={filters.salaryMin || ""}
                    onChange={(e) =>
                      handleFilterChange("salaryMin", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salaryMax" className="text-xs text-muted-foreground">
                    Max ($)
                  </Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="e.g., 150000"
                    value={filters.salaryMax || ""}
                    onChange={(e) =>
                      handleFilterChange("salaryMax", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Deadline Range Filter */}
            <div className="space-y-3">
              <Label>Application Deadline</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="deadlineFrom" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="deadlineFrom"
                    type="date"
                    value={filters.deadlineFrom || ""}
                    onChange={(e) =>
                      handleFilterChange("deadlineFrom", e.target.value || undefined)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deadlineTo" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="deadlineTo"
                    type="date"
                    value={filters.deadlineTo || ""}
                    onChange={(e) =>
                      handleFilterChange("deadlineTo", e.target.value || undefined)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Archive Filter */}
            <div className="space-y-2">
              <Label>Show</Label>
              <Select
                value={
                  filters.isArchived === undefined
                    ? "active"
                    : filters.isArchived
                    ? "archived"
                    : "active"
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    "isArchived",
                    value === "all" ? undefined : value === "archived"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Jobs</SelectItem>
                  <SelectItem value="archived">Archived Jobs</SelectItem>
                  <SelectItem value="all">All Jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) =>
                  handleFilterChange("sortOrder", value as "asc" | "desc")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => {
                  onClearFilters();
                  setIsOpen(false);
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Saved Searches Dialog */}
      <SavedSearchesDialog
        open={savedSearchesOpen}
        onOpenChange={setSavedSearchesOpen}
        currentFilters={filters}
        onApplySearch={(newFilters) => {
          onFiltersChange(newFilters);
        }}
      />
    </div>
  );
};
