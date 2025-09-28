import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  getOfflineReports, 
  removeOfflineReport, 
  setLastSyncTime, 
  getOfflineEducationContent,
  saveOfflineEducationContent,
  shouldRefreshEducationContent,
  OfflineReport 
} from '@/utils/offlineStorage';

export const useOfflineSync = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const syncOfflineReports = useCallback(async () => {
    const offlineReports = getOfflineReports();
    if (offlineReports.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      let syncedCount = 0;
      const total = offlineReports.length;

      for (const report of offlineReports) {
        try {
          const reportData = {
            patient_name: report.patient_name,
            village: report.village,
            symptoms: report.symptoms,
            water_source: report.water_source || '',
            submitted_via: report.submitted_via,
            asha_id: report.asha_id || profile?.user_id
          };

          const { error } = await supabase
            .from('reports')
            .insert([reportData]);

          if (!error) {
            removeOfflineReport(report.id);
            syncedCount++;
          } else {
            console.error('Failed to sync report:', error);
          }
        } catch (error) {
          console.error('Error syncing individual report:', error);
        }

        setSyncProgress((syncedCount / total) * 100);
      }

      if (syncedCount > 0) {
        setLastSyncTime();
        toast({
          title: t('messages.success'),
          description: t('offline.syncSuccess', { count: syncedCount })
        });
      }

      if (syncedCount < total) {
        const failedCount = total - syncedCount;
        toast({
          title: t('messages.warning'),
          description: t('offline.syncPartial', { failed: failedCount }),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: t('messages.error'),
        description: t('offline.syncFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [profile?.user_id, t]);

  const refreshEducationContent = useCallback(async (userRole: string) => {
    if (!shouldRefreshEducationContent()) {
      return getOfflineEducationContent();
    }

    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .or(`target_role.eq.${userRole},target_role.eq.community`)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!error && data) {
        const educationContent = data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          target_role: item.target_role,
          priority: item.priority,
          cached_at: new Date().toISOString()
        }));

        saveOfflineEducationContent(educationContent);
        return educationContent;
      }
    } catch (error) {
      console.error('Failed to refresh education content:', error);
    }

    // Return cached content if refresh fails
    return getOfflineEducationContent();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine && profile) {
        setTimeout(() => {
          syncOfflineReports();
        }, 1000); // Wait a second for connection to stabilize
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Initial sync check if already online
    if (navigator.onLine && profile) {
      syncOfflineReports();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [profile, syncOfflineReports]);

  return {
    isSyncing,
    syncProgress,
    syncOfflineReports,
    refreshEducationContent
  };
};