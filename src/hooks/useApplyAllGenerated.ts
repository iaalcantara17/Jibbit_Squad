import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GeneratedContent {
  summary?: string;
  experienceVariants?: Array<{
    experience_id: string;
    relevance_score: number;
    suggested_markdown: string;
  }>;
  skills?: Array<{
    name: string;
    proficiency?: string;
  }>;
}

interface ApplyAllGeneratedParams {
  resumeId: string;
  generated: GeneratedContent;
}

/**
 * Hook to atomically apply all AI-generated content to a resume
 * Handles summary, experience variants, and skills in one transaction
 */
export function useApplyAllGenerated() {
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();

  const applyAllGenerated = async ({ resumeId, generated }: ApplyAllGeneratedParams) => {
    if (!generated.summary && (!generated.experienceVariants || generated.experienceVariants.length === 0) && (!generated.skills || generated.skills.length === 0)) {
      throw new Error('No content to apply');
    }

    setIsApplying(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const operations: Promise<any>[] = [];

      // 1. Update summary if present
      if (generated.summary) {
        operations.push(
          (async () => {
            const { error } = await supabase
              .from('resumes')
              .update({ ai_generated: { summary: generated.summary } })
              .eq('id', resumeId)
              .eq('user_id', user.id);
            
            if (error) throw error;
          })()
        );
      }

      // 2. Upsert experience variants if present
      if (generated.experienceVariants && generated.experienceVariants.length > 0) {
        operations.push(
          (async () => {
            const variants = generated.experienceVariants!.map(v => ({
              user_id: user.id,
              resume_experience_id: v.experience_id,
              job_id: resumeId,
              content_markdown: v.suggested_markdown,
              relevance_score: v.relevance_score,
              accepted: true,
            }));

            const { error } = await supabase
              .from('resume_experience_variants')
              .upsert(variants, { onConflict: 'resume_experience_id,job_id' });
            
            if (error) throw error;
          })()
        );
      }

      // 3. Upsert skills if present (dedupe by name)
      if (generated.skills && generated.skills.length > 0) {
        operations.push(
          (async () => {
            // Get existing profile skills
            const { data: profile } = await supabase
              .from('profiles')
              .select('skills')
              .eq('user_id', user.id)
              .single();

            const existingSkills = (profile?.skills || []) as Array<{ name: string; proficiency?: string }>;
            const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()));

            // Add only new skills (dedupe by name)
            const newSkills = generated.skills!.filter(
              skill => !existingNames.has(skill.name.toLowerCase())
            );

            if (newSkills.length > 0) {
              const updatedSkills = [...existingSkills, ...newSkills];
              const { error } = await supabase
                .from('profiles')
                .update({ skills: updatedSkills })
                .eq('user_id', user.id);
              
              if (error) throw error;
            }
          })()
        );
      }

      // Execute all operations atomically
      await Promise.all(operations);

      // Invalidate relevant queries for UI update
      await queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resumeExperience', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resumeSkills', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      toast.success('All generated content applied successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to apply generated content:', error);
      toast.error(error.message || 'Failed to apply generated content');
      return { success: false, error: error.message };
    } finally {
      setIsApplying(false);
    }
  };

  return { applyAllGenerated, isApplying };
}
