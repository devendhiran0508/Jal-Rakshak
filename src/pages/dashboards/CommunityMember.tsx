import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Users, AlertTriangle, BookOpen, LogOut, Droplets, Heart } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import OfflineIndicator from '@/components/OfflineIndicator';
import HealthEducation from '@/components/HealthEducation';
import FeedbackForm from '@/components/FeedbackForm';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface Alert {
  id: string;
  message: string;
  target_roles: string[];
  created_at: string;
  village?: string;
  type?: string;
  disease_or_parameter?: string;
  value?: number;
  auto?: boolean;
}

const CommunityMember: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { refreshEducationContent } = useOfflineSync();

  useEffect(() => {
    fetchAlerts();
    
    // Cache education content for offline use
    if (profile?.role) {
      refreshEducationContent(profile.role);
    }
    
    // Set up real-time subscription for alerts
    const channel = supabase
      .channel('community-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          if (newAlert.target_roles.includes('community')) {
            setAlerts(current => [newAlert, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .contains('target_roles', ['community'])
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('messages.error'),
        description: "Failed to fetch alerts",
        variant: "destructive"
      });
    } else {
      setAlerts(data || []);
    }
  };

  const healthEducationContent = [
    {
      title: t('community.waterPurificationMethods'),
      content: t('community.waterPurificationDesc'),
      icon: <Droplets className="h-6 w-6 text-primary" />
    },
    {
      title: t('community.preventingWaterborne'),
      content: t('community.preventingWaterborneDesc'),
      icon: <Heart className="h-6 w-6 text-secondary" />
    },
    {
      title: t('community.recognizingSymptoms'),
      content: t('community.recognizingSymptomsDesc'),
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />
    },
    {
      title: t('community.communityHygiene'),
      content: t('community.communityHygieneDesc'),
      icon: <Users className="h-6 w-6 text-accent" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('roles.community')} {t('dashboard.overview')}</h1>
              <p className="text-muted-foreground">{t('dashboard.welcome')}, {profile?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <OfflineIndicator />
            <LanguageToggle />
            <Button onClick={signOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.logout')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {t('community.healthAlerts')} ({alerts.length})
              </CardTitle>
              <CardDescription>
                {t('community.alertsFromOfficials')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('community.noAlertsNow')}</p>
                    <p className="text-sm text-muted-foreground">{t('community.stayTuned')}</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`border-l-4 border-destructive bg-destructive/5 p-4 rounded-r-lg ${alert.auto ? 'border-orange-400 bg-orange-50' : ''}`}>
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                            {alert.auto && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {t('community.aiPredicted')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Education Section */}
        <div className="mt-6">
          <HealthEducation userRole="community" />
        </div>

        {/* Quick Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('community.quickHealthTips')}</CardTitle>
            <CardDescription>{t('community.dailyPractices')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Droplets className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">{t('community.cleanWater')}</h4>
                <p className="text-xs text-muted-foreground">{t('community.alwaysUsePurified')}</p>
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-lg">
                <Heart className="h-8 w-8 text-secondary mx-auto mb-2" />
                <h4 className="font-semibold text-sm">{t('community.handHygiene')}</h4>
                <p className="text-xs text-muted-foreground">{t('community.washHandsFrequently')}</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold text-sm">{t('community.communityCare')}</h4>
                <p className="text-xs text-muted-foreground">{t('community.helpNeighbors')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityMember;