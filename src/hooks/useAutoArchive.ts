import { useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AutoArchiveConfig {
  enabled: boolean;
  daysAfterRejection?: number;
  daysAfterOffer?: number;
  daysInactive?: number;
}

export const useAutoArchive = (config: AutoArchiveConfig) => {
  useEffect(() => {
    if (!config.enabled) return;

    const checkAndArchive = async () => {
      try {
        const jobs = await api.jobs.getAll({ isArchived: false });
        const now = new Date();
        let archivedCount = 0;

        for (const job of jobs) {
          let shouldArchive = false;
          let reason = '';

          // Auto-archive rejected jobs after specified days
          if (config.daysAfterRejection && job.status === 'Rejected') {
            const statusHistory = Array.isArray(job.status_history) ? job.status_history as any[] : [];
            const rejectionEntry = statusHistory.find((h: any) => h.status === 'Rejected');
            const statusDate = rejectionEntry?.changedAt as string;
            if (statusDate) {
              const daysSince = Math.floor((now.getTime() - new Date(statusDate).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince >= config.daysAfterRejection) {
                shouldArchive = true;
                reason = `Auto-archived ${config.daysAfterRejection} days after rejection`;
              }
            }
          }

          // Auto-archive accepted offers after specified days
          if (config.daysAfterOffer && job.status === 'Offer' && !shouldArchive) {
            const statusHistory = Array.isArray(job.status_history) ? job.status_history as any[] : [];
            const offerEntry = statusHistory.find((h: any) => h.status === 'Offer');
            const statusDate = offerEntry?.changedAt as string;
            if (statusDate) {
              const daysSince = Math.floor((now.getTime() - new Date(statusDate).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince >= config.daysAfterOffer) {
                shouldArchive = true;
                reason = `Auto-archived ${config.daysAfterOffer} days after offer`;
              }
            }
          }

          // Auto-archive inactive jobs
          if (config.daysInactive && !shouldArchive) {
            const lastUpdate = new Date(job.updated_at);
            const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceUpdate >= config.daysInactive && job.status === 'Interested') {
              shouldArchive = true;
              reason = `Auto-archived due to ${config.daysInactive} days of inactivity`;
            }
          }

          if (shouldArchive) {
            await api.jobs.archive(job.id, reason);
            archivedCount++;
          }
        }

        if (archivedCount > 0) {
          toast.info(`Auto-archived ${archivedCount} job${archivedCount > 1 ? 's' : ''}`, {
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to archived jobs
                window.location.href = '/jobs?view=archived';
              }
            }
          });
        }
      } catch (error) {
        console.error('Auto-archive error:', error);
      }
    };

    // Check on mount
    checkAndArchive();

    // Check daily
    const interval = setInterval(checkAndArchive, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config]);
};
