export interface OfflineReport {
  id: string;
  patient_name: string;
  village: string;
  symptoms: string;
  water_source?: string;
  submitted_via: 'offline_villager' | 'SMS' | 'SMS_villager';
  created_at: string;
  asha_id?: string;
  age?: number;
}

export interface OfflineEducationContent {
  id: string;
  title: string;
  content: string;
  category: string;
  target_role: string;
  priority: number;
  cached_at: string;
}

const OFFLINE_REPORTS_KEY = 'jal_rakshak_offline_reports';
const OFFLINE_EDUCATION_KEY = 'jal_rakshak_offline_education';
const LAST_SYNC_KEY = 'jal_rakshak_last_sync';

// Offline Reports Management
export const saveOfflineReport = (report: OfflineReport): void => {
  try {
    const existingReports = getOfflineReports();
    const updatedReports = [report, ...existingReports];
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updatedReports));
  } catch (error) {
    console.error('Failed to save offline report:', error);
  }
};

export const getOfflineReports = (): OfflineReport[] => {
  try {
    const reports = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return reports ? JSON.parse(reports) : [];
  } catch (error) {
    console.error('Failed to get offline reports:', error);
    return [];
  }
};

export const clearOfflineReports = (): void => {
  try {
    localStorage.removeItem(OFFLINE_REPORTS_KEY);
  } catch (error) {
    console.error('Failed to clear offline reports:', error);
  }
};

export const removeOfflineReport = (reportId: string): void => {
  try {
    const reports = getOfflineReports();
    const filteredReports = reports.filter(report => report.id !== reportId);
    localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(filteredReports));
  } catch (error) {
    console.error('Failed to remove offline report:', error);
  }
};

// Offline Education Content Management
export const saveOfflineEducationContent = (content: OfflineEducationContent[]): void => {
  try {
    const dataWithTimestamp = {
      content,
      cached_at: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_EDUCATION_KEY, JSON.stringify(dataWithTimestamp));
  } catch (error) {
    console.error('Failed to save offline education content:', error);
  }
};

export const getOfflineEducationContent = (): OfflineEducationContent[] => {
  try {
    const data = localStorage.getItem(OFFLINE_EDUCATION_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return parsed.content || [];
  } catch (error) {
    console.error('Failed to get offline education content:', error);
    return [];
  }
};

// Network status detection
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Sync management
export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(LAST_SYNC_KEY);
};

export const setLastSyncTime = (): void => {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

// Utility to check if education content needs refresh (older than 24 hours)
export const shouldRefreshEducationContent = (): boolean => {
  try {
    const data = localStorage.getItem(OFFLINE_EDUCATION_KEY);
    if (!data) return true;
    
    const parsed = JSON.parse(data);
    const cachedAt = new Date(parsed.cached_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  } catch (error) {
    return true;
  }
};

// Generic offline storage for any data type
export const saveToOfflineStorage = (key: string, data: any): void => {
  try {
    const storageKey = `jal_rakshak_offline_${key}`;
    const existingData = getFromOfflineStorage(key);
    const updatedData = Array.isArray(existingData) ? [data, ...existingData] : [data];
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
  } catch (error) {
    console.error(`Failed to save to offline storage (${key}):`, error);
  }
};

export const getFromOfflineStorage = (key: string): any[] => {
  try {
    const storageKey = `jal_rakshak_offline_${key}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Failed to get from offline storage (${key}):`, error);
    return [];
  }
};