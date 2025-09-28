import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Upload } from 'lucide-react';
import { getOfflineReports } from '@/utils/offlineStorage';

const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending reports
    const updatePendingReports = () => {
      const offlineReports = getOfflineReports();
      setPendingReports(offlineReports.length);
    };

    updatePendingReports();
    
    // Check every 5 seconds for pending reports
    const interval = setInterval(updatePendingReports, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingReports === 0) {
    return null; // Don't show anything when online with no pending reports
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          {t('offline.offline')}
        </Badge>
      )}
      
      {pendingReports > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Upload className="h-3 w-3" />
          {t('offline.pendingReports', { count: pendingReports })}
        </Badge>
      )}
      
      {isOnline && pendingReports === 0 && (
        <Badge variant="default" className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          {t('offline.online')}
        </Badge>
      )}
    </div>
  );
};

export default OfflineIndicator;