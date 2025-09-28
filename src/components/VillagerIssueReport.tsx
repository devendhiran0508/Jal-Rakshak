import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Droplets, Users, Wrench, HelpCircle } from 'lucide-react';
import { saveToOfflineStorage } from '@/utils/offlineStorage';

interface CommunityReport {
  id: string;
  issue_type: string;
  description?: string;
  village: string;
  created_at: string;
}

const VillagerIssueReport: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    issueType: '',
    description: ''
  });
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);

  const issueTypeOptions = [
    { value: 'dirty_water', label: t('villager.dirtyWater'), icon: Droplets, color: 'text-blue-600' },
    { value: 'many_people_sick', label: t('villager.manyPeopleSick'), icon: Users, color: 'text-red-600' },
    { value: 'hand_pump_broken', label: t('villager.handPumpBroken'), icon: Wrench, color: 'text-orange-600' },
    { value: 'other', label: t('forms.other'), icon: HelpCircle, color: 'text-gray-600' }
  ];

  useEffect(() => {
    fetchMyReports();
    
    // Set up real-time subscription for user's reports
    const channel = supabase
      .channel('my-community-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_reports',
          filter: `submitted_by=eq.${profile?.user_id}`
        },
        (payload) => {
          setReports(current => [payload.new as CommunityReport, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const fetchMyReports = async () => {
    if (!profile?.user_id) return;

    const { data, error } = await supabase
      .from('community_reports')
      .select('*')
      .eq('submitted_by', profile.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community reports:', error);
    } else {
      setReports(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id || !profile?.village) return;

    setLoading(true);

    const reportData = {
      issue_type: formData.issueType,
      description: formData.description || null,
      village: profile.village,
      submitted_by: profile.user_id
    };

    try {
      const { error } = await supabase
        .from('community_reports')
        .insert([reportData]);

      if (error) throw error;

      toast({
        title: t('messages.success'),
        description: t('villager.issueReported'),
        variant: "default"
      });

      setFormData({ issueType: '', description: '' });
    } catch (error) {
      console.error('Error submitting report:', error);
      
      // Save to offline storage as fallback
      await saveToOfflineStorage('community_reports', {
        ...reportData,
        id: `offline_${Date.now()}`,
        created_at: new Date().toISOString()
      });

      toast({
        title: t('messages.offline'),
        description: t('villager.issueSavedOffline'),
        variant: "default"
      });
    }

    setLoading(false);
  };

  const getIssueIcon = (issueType: string) => {
    const option = issueTypeOptions.find(opt => opt.value === issueType);
    return option ? option.icon : HelpCircle;
  };

  const getIssueLabel = (issueType: string) => {
    const option = issueTypeOptions.find(opt => opt.value === issueType);
    return option ? option.label : issueType;
  };

  return (
    <div className="space-y-6">
      {/* Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {t('villager.reportAnIssue')}
          </CardTitle>
          <CardDescription>
            {t('villager.reportCommunityIssues')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueType">{t('villager.issueType')} *</Label>
              <Select
                value={formData.issueType}
                onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('villager.selectIssueType')} />
                </SelectTrigger>
                <SelectContent>
                  {issueTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('forms.description')} ({t('forms.optional')})</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('villager.describeIssue')}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/200 {t('forms.characters')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.village')}</Label>
              <Input
                value={profile?.village || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={loading || !formData.issueType} className="w-full">
              {loading ? t('forms.submitting') : t('villager.submitIssue')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {t('villager.myReports')} ({reports.length})
          </CardTitle>
          <CardDescription>
            {t('villager.yourSubmittedIssues')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('villager.noReportsYet')}</p>
                <p className="text-sm text-muted-foreground">{t('villager.reportIssuesAbove')}</p>
              </div>
            ) : (
              reports.map((report) => {
                const IconComponent = getIssueIcon(report.issue_type);
                return (
                  <div key={report.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">{getIssueLabel(report.issue_type)}</h4>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(report.created_at).toLocaleDateString()} • {report.village}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VillagerIssueReport;