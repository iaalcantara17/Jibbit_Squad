import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Folder, Calendar, Link as LinkIcon, Github, Code2, Loader2, Grid3x3, List, Search, Share2, Download, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  role: string;
  technologies: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  projectUrl: string;
  repositoryUrl: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'relevance';

export const SpecialProjectsManagement = () => {
  const { refreshProfile } = useAuth();
  const [entries, setEntries] = useState<ProjectEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  
  const [formData, setFormData] = useState<Omit<ProjectEntry, 'id'>>({
    name: '',
    description: '',
    role: '',
    technologies: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    projectUrl: '',
    repositoryUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    const response = await api.getProjects();
    if (response.success && response.data) {
      setEntries(response.data);
    }
    setIsLoading(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 500) newErrors.description = 'Description must be less than 500 characters';
    if (!formData.role.trim()) newErrors.role = 'Your role is required';
    if (!formData.technologies.trim()) newErrors.technologies = 'Technologies are required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.ongoing && !formData.endDate) {
      newErrors.endDate = 'End date is required for completed projects';
    }
    if (formData.startDate && formData.endDate && !formData.ongoing) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    if (formData.projectUrl && !isValidUrl(formData.projectUrl)) {
      newErrors.projectUrl = 'Please enter a valid URL';
    }
    if (formData.repositoryUrl && !isValidUrl(formData.repositoryUrl)) {
      newErrors.repositoryUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      if (editingId) {
        const response = await api.updateProject(editingId, formData);
        if (response.success) {
          await fetchProjects();
          await refreshProfile();
          toast({
            title: 'Project updated',
            description: 'Your project has been updated successfully.',
          });
          setEditingId(null);
        } else {
          toast({
            title: 'Update failed',
            description: response.error?.message || 'Failed to update project',
            variant: 'destructive',
          });
        }
      } else {
        const response = await api.addProject(formData);
        if (response.success) {
          await fetchProjects();
          await refreshProfile();
          toast({
            title: 'Project added',
            description: 'Your project has been added successfully.',
          });
        } else {
          toast({
            title: 'Add failed',
            description: response.error?.message || 'Failed to add project',
            variant: 'destructive',
          });
        }
      }

      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: ProjectEntry) => {
    setFormData({
      name: entry.name,
      description: entry.description,
      role: entry.role,
      technologies: entry.technologies,
      startDate: entry.startDate,
      endDate: entry.endDate,
      ongoing: entry.ongoing,
      projectUrl: entry.projectUrl,
      repositoryUrl: entry.repositoryUrl,
    });
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const response = await api.deleteProject(deleteId);
    if (response.success) {
      await fetchProjects();
      await refreshProfile();
      toast({
        title: 'Project deleted',
        description: 'The project has been removed from your profile.',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: response.error?.message || 'Failed to delete project',
        variant: 'destructive',
      });
    }
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      role: '',
      technologies: '',
      startDate: '',
      endDate: '',
      ongoing: false,
      projectUrl: '',
      repositoryUrl: '',
    });
    setErrors({});
    setIsAdding(false);
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const shareProject = (project: ProjectEntry) => {
    const shareData = {
      title: project.name,
      text: `Check out my project: ${project.name}\n${project.description}`,
      url: project.projectUrl || window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        copyToClipboard(project);
      });
    } else {
      copyToClipboard(project);
    }
  };

  const copyToClipboard = (project: ProjectEntry) => {
    const text = `${project.name}\n${project.description}\n${project.projectUrl || window.location.href}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Project details copied to clipboard',
    });
  };

  const printProject = (project: ProjectEntry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${project.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .meta { color: #666; margin: 20px 0; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${project.name}</h1>
          <div class="meta">
            <p><span class="label">Role:</span> ${project.role}</p>
            <p><span class="label">Duration:</span> ${formatDate(project.startDate)} - ${project.ongoing ? 'Present' : formatDate(project.endDate)}</p>
            <p><span class="label">Technologies:</span> ${project.technologies}</p>
          </div>
          <div class="section">
            <p class="label">Description:</p>
            <p>${project.description}</p>
          </div>
          ${project.projectUrl ? `<div class="section"><p class="label">Project URL:</p><p>${project.projectUrl}</p></div>` : ''}
          ${project.repositoryUrl ? `<div class="section"><p class="label">Repository:</p><p>${project.repositoryUrl}</p></div>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter and sort projects
  const filteredAndSortedEntries = entries
    .filter(entry => {
      const matchesSearch = 
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTech = !techFilter || 
        entry.technologies.toLowerCase().includes(techFilter.toLowerCase());
      
      return matchesSearch && matchesTech;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'date') {
        if (a.ongoing && !b.ongoing) return -1;
        if (!a.ongoing && b.ongoing) return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      // relevance - ongoing first, then by date
      if (a.ongoing && !b.ongoing) return -1;
      if (!a.ongoing && b.ongoing) return 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search, Filter, and View Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by technology..."
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="relevance">Sort by: Relevance</option>
            <option value="date">Sort by: Date</option>
            <option value="name">Sort by: Name</option>
          </select>
        </div>
      </div>

      {isAdding ? (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., E-commerce Platform"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project, its goals, and outcomes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500 characters
                  </p>
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Lead Developer, Project Manager"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={errors.role ? 'border-destructive' : ''}
                  />
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies Used *</Label>
                  <Input
                    id="technologies"
                    placeholder="e.g., React, Node.js, PostgreSQL"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    className={errors.technologies ? 'border-destructive' : ''}
                  />
                  {errors.technologies && <p className="text-sm text-destructive">{errors.technologies}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={errors.startDate ? 'border-destructive' : ''}
                  />
                  {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="month"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={formData.ongoing}
                    className={errors.endDate ? 'border-destructive' : ''}
                  />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ongoing"
                    checked={formData.ongoing}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, ongoing: checked as boolean, endDate: checked ? '' : formData.endDate })
                    }
                  />
                  <Label htmlFor="ongoing" className="cursor-pointer">
                    Ongoing project
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectUrl">Project URL (Optional)</Label>
                  <Input
                    id="projectUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.projectUrl}
                    onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                    className={errors.projectUrl ? 'border-destructive' : ''}
                  />
                  {errors.projectUrl && <p className="text-sm text-destructive">{errors.projectUrl}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
                  <Input
                    id="repositoryUrl"
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                    className={errors.repositoryUrl ? 'border-destructive' : ''}
                  />
                  {errors.repositoryUrl && <p className="text-sm text-destructive">{errors.repositoryUrl}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingId ? 'Update Project' : 'Add Project'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Special Project
        </Button>
      )}

      {filteredAndSortedEntries.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
          {filteredAndSortedEntries.map((entry) => (
            <Card key={entry.id} className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{entry.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{entry.role}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.startDate)} - {entry.ongoing ? 'Present' : formatDate(entry.endDate)}
                            {entry.ongoing && (
                              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                Ongoing
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Code2 className="h-3 w-3" />
                            {entry.technologies}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {entry.description}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {entry.projectUrl && (
                            <a
                              href={entry.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <LinkIcon className="h-3 w-3" />
                              View Project
                            </a>
                          )}
                          {entry.repositoryUrl && (
                            <a
                              href={entry.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Github className="h-3 w-3" />
                              View Repository
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => shareProject(entry)}
                      title="Share project"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => printProject(entry)}
                      title="Print project"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isAdding && (
          <Card>
            <CardContent className="py-12 text-center">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || techFilter ? 'No projects match your filters' : 'No projects added yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || techFilter
                  ? 'Try adjusting your search or filters'
                  : 'Add special projects to showcase your work beyond regular employment'}
              </p>
            </CardContent>
          </Card>
        )
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
