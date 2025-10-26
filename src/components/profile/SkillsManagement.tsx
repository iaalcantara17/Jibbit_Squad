import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Code, MessageSquare, Languages, Wrench, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Skill {
  id: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'Technical' | 'Soft Skills' | 'Languages' | 'Industry-Specific';
}

const categoryIcons = {
  'Technical': Code,
  'Soft Skills': MessageSquare,
  'Languages': Languages,
  'Industry-Specific': Wrench,
};

const proficiencyColors = {
  'Beginner': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Intermediate': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Advanced': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Expert': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const SkillsManagement = () => {
  const { refreshProfile } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    proficiency: 'Intermediate' as Skill['proficiency'],
    category: 'Technical' as Skill['category'],
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setIsLoading(true);
    const response = await api.getSkills();
    if (response.success && response.data) {
      setSkills(response.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Skill name required',
        description: 'Please enter a skill name',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicates
    const duplicate = skills.find(
      s => s.name.toLowerCase() === formData.name.toLowerCase() && s.id !== editingId
    );
    
    if (duplicate) {
      toast({
        title: 'Duplicate skill',
        description: 'This skill already exists in your profile',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const response = await api.updateSkill(editingId, formData);
        if (response.success) {
          await fetchSkills();
          await refreshProfile();
          toast({
            title: 'Skill updated',
            description: 'Your skill has been updated successfully',
          });
          setEditingId(null);
        } else {
          toast({
            title: 'Update failed',
            description: response.error?.message || 'Failed to update skill',
            variant: 'destructive',
          });
        }
      } else {
        const response = await api.addSkill(formData);
        if (response.success) {
          await fetchSkills();
          await refreshProfile();
          toast({
            title: 'Skill added',
            description: 'New skill has been added to your profile',
          });
        } else {
          toast({
            title: 'Add failed',
            description: response.error?.message || 'Failed to add skill',
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

  const handleEdit = (skill: Skill) => {
    setFormData({
      name: skill.name,
      proficiency: skill.proficiency,
      category: skill.category,
    });
    setEditingId(skill.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const response = await api.deleteSkill(id);
    if (response.success) {
      await fetchSkills();
      await refreshProfile();
      toast({
        title: 'Skill removed',
        description: 'The skill has been removed from your profile',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: response.error?.message || 'Failed to delete skill',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      proficiency: 'Intermediate',
      category: 'Technical',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const sortedCategories = Object.keys(groupedSkills).sort();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {isAdding ? (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="skillName">Skill Name *</Label>
                  <Input
                    id="skillName"
                    placeholder="e.g., React, JavaScript, Project Management"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proficiency">Proficiency Level</Label>
                  <select
                    id="proficiency"
                    value={formData.proficiency}
                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as Skill['proficiency'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Skill['category'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Soft Skills">Soft Skills</option>
                    <option value="Languages">Languages</option>
                    <option value="Industry-Specific">Industry-Specific</option>
                  </select>
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
                    editingId ? 'Update Skill' : 'Add Skill'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      )}

      {/* Skills Display by Category */}
      {sortedCategories.length > 0 ? (
        <div className="space-y-6">
          {sortedCategories.map((category) => {
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
            const categorySkills = groupedSkills[category];
            
            return (
              <Card key={category}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <span className="text-sm text-muted-foreground">({categorySkills.length})</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="px-3 py-1.5 text-sm cursor-pointer hover-scale group relative"
                        onClick={() => handleEdit(skill)}
                      >
                        <span className="mr-2">{skill.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${proficiencyColors[skill.proficiency]}`}>
                          {skill.proficiency}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(skill.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !isAdding && (
          <Card>
            <CardContent className="py-12 text-center">
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No skills added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your skills to showcase your capabilities to employers
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};
