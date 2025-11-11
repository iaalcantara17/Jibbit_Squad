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
import { Filter, X, Search, Save } from "lucide-react";
import { JobStatus, JobType, JobFilters as JobFiltersType } from "@/types/jobs";
import { SavedSearchesDialog } from "./SavedSearchesDialog";
import { JOB_STATUS, STATUS_LABELS, getStatusLabel } from '@/lib/constants/jobStatus';

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

  const hasActiveFilters = 
    filters.search || 
    filters.status || 
    filters.isArchived !== undefined || 
    filters.sortBy;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleFilterChange = (key: keyof JobFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
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
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  handleFilterChange("status", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {JOB_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
