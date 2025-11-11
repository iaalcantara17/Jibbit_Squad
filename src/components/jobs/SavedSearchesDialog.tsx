import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JobFilters } from '@/types/jobs';
import { savedSearchesApi, SavedSearch } from '@/lib/api/savedSearches';
import { toast } from 'sonner';
import { Trash2, Search } from 'lucide-react';

interface SavedSearchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: JobFilters;
  onApplySearch: (filters: JobFilters) => void;
}

export function SavedSearchesDialog({ 
  open, 
  onOpenChange, 
  currentFilters, 
  onApplySearch 
}: SavedSearchesDialogProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSavedSearches = async () => {
    setIsLoading(true);
    try {
      const searches = await savedSearchesApi.getAll();
      setSavedSearches(searches);
    } catch (error) {
      toast.error('Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSavedSearches();
    }
  }, [open]);

  const handleSaveSearch = async () => {
    if (!newSearchName.trim()) {
      toast.error('Please enter a name for your search');
      return;
    }

    setIsSaving(true);
    try {
      await savedSearchesApi.create(newSearchName, currentFilters);
      toast.success('Search saved successfully');
      setNewSearchName('');
      loadSavedSearches();
    } catch (error) {
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = (search: SavedSearch) => {
    onApplySearch(search.filters);
    toast.success(`Applied search: ${search.name}`);
    onOpenChange(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved search?')) return;
    
    try {
      await savedSearchesApi.delete(id);
      toast.success('Search deleted');
      loadSavedSearches();
    } catch (error) {
      toast.error('Failed to delete search');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Searches</DialogTitle>
          <DialogDescription>
            Save your current filters or apply a saved search
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save Current Search */}
          <div className="space-y-2 pb-4 border-b">
            <Label>Save Current Filters</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search name..."
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
              <Button 
                onClick={handleSaveSearch} 
                disabled={isSaving || !newSearchName.trim()}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Saved Searches List */}
          <div className="space-y-2">
            <Label>Your Saved Searches</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading...
              </p>
            ) : savedSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No saved searches yet
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start h-auto py-2"
                      onClick={() => handleApply(search)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      <span className="font-medium">{search.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(search.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
