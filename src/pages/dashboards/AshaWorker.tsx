import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Heart, Plus, FileText, LogOut, AlertTriangle, MessageSquare, WifiOff } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import OfflineIndicator from '@/components/OfflineIndicator';
import SMSPreviewDialog from '@/components/SMSPreviewDialog';
import { runOutbreakDetection } from '@/utils/outbreakDetection';
import { UserRole } from '@/contexts/AuthContext';
import { saveOfflineReport, isOnline } from '@/utils/offlineStorage';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface Report {
  id: string;
  patient_name: string;
  village: string;
  symptoms: string;
  water_source: string;
  created_at: string;
}

interface Alert {
  id: string;
  message: string;
  target_roles: UserRole[];
  created_at: string;
  village?: string;
  type?: string;
  disease_or_parameter?: string;
  value?: number;
  auto?: boolean;
}

const AshaWorker: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsContent, setSmsContent] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsInputText, setSmsInputText] = useState('');
  const [smsParseLoading, setSmsParseLoading] = useState(false);
  const { syncOfflineReports } = useOfflineSync();
  const [formData, setFormData] = useState({
    patient_name: '',
    village: profile?.village || '',
    symptoms: '',
    water_source: ''
  });

  useEffect(() => {
    fetchReports();
    fetchAlerts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('asha-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `asha_id=eq.${profile?.user_id}`
        },
        (payload) => {
          setReports(current => [payload.new as Report, ...current]);
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('asha-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          if (profile?.role && newAlert.target_roles.includes(profile.role)) {
            setAlerts(current => [newAlert, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(alertsChannel);
    };
  }, [profile?.user_id, profile?.role]);

  const fetchReports = async () => {
    if (!profile?.user_id) return;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('asha_id', profile.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('messages.error'),
        description: t('asha.errorFetchReports'),
        variant: "destructive"
      });
    } else {
      setReports(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            asha_id: profile.user_id,
            patient_name: formData.patient_name,
            village: formData.village,
            symptoms: formData.symptoms,
            water_source: formData.water_source,
            submitted_via: 'online'
          }
        ]);

      if (error) {
        toast({
          title: t('messages.error'),
          description: t('asha.errorSubmitReport'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('messages.success'),
          description: t('asha.reportSubmitted')
        });
        setFormData({
          patient_name: '',
          village: profile?.village || '',
          symptoms: '',
          water_source: ''
        });
        
        // Run outbreak detection after successful report submission
        await runOutbreakDetection({
          village: formData.village,
          symptoms: formData.symptoms
        });
      }
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('asha.errorSubmitReport'),
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const parseSMSInput = (text: string) => {
    // Parse SMS format: REPORT <Name> <Village> <Symptom> <WaterSource>
    const trimmedText = text.trim();
    const parts = trimmedText.split(' ');
    
    if (parts.length < 5 || parts[0].toUpperCase() !== 'REPORT') {
      return null;
    }
    
    // Extract parts (handle spaces in names by joining appropriately)
    const [, ...restParts] = parts;
    
    // Find indices for village, symptom, and water source
    // For simplicity, assume format: REPORT Name Village Symptom WaterSource
    if (restParts.length < 4) {
      return null;
    }
    
    return {
      patient_name: restParts[0],
      village: restParts[1], 
      symptoms: restParts[2],
      water_source: restParts[3]
    };
  };

  const handleSMSFallbackSubmit = async () => {
    if (!profile?.user_id) return;
    
    setSmsParseLoading(true);
    
    try {
      const parsedData = parseSMSInput(smsInputText);
      
      if (!parsedData) {
        toast({
          title: t('messages.error'),
          description: "Invalid SMS format. Please use REPORT <Name> <Village> <Symptom> <WaterSource>",
          variant: "destructive"
        });
        setSmsParseLoading(false);
        return;
      }
      
      // Save to Supabase reports table
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            asha_id: profile.user_id,
            patient_name: parsedData.patient_name,
            village: parsedData.village,
            symptoms: parsedData.symptoms,
            water_source: parsedData.water_source,
            submitted_via: 'SMS'
          }
        ]);

      if (error) {
        toast({
          title: t('messages.error'),
          description: t('asha.errorSubmitReport'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('messages.success'),
          description: "SMS Report Submitted"
        });
        
        setSmsInputText('');
        
        // Run outbreak detection after successful SMS report submission
        await runOutbreakDetection({
          village: parsedData.village,
          symptoms: parsedData.symptoms
        });
      }
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('asha.errorSubmitReport'),
        variant: "destructive"
      });
    }
    
    setSmsParseLoading(false);
  };

  const generateSMSContent = () => {
    const currentTime = new Date().toLocaleString();
    return `[HEALTH REPORT - OFFLINE]
Reporter: ${profile?.name} (${profile?.user_id})
Village: ${formData.village}
Patient: ${formData.patient_name}
Symptoms: ${formData.symptoms}
Water Source: ${formData.water_source}
Time: ${currentTime}
[Please process this SMS report]`;
  };

  const handleSMSMode = () => {
    if (!formData.patient_name || !formData.symptoms) {
      toast({
        title: t('messages.error'),
        description: "Please fill in patient name and symptoms",
        variant: "destructive"
      });
      return;
    }
    
    const content = generateSMSContent();
    setSmsContent(content);
    setSmsDialogOpen(true);
  };

  const handleSMSOfflineSubmit = () => {
    if (!profile?.user_id) return;

    setSmsLoading(true);
    
    const offlineReport = {
      id: `sms_${Date.now()}_${Math.random()}`,
      patient_name: formData.patient_name,
      village: formData.village,
      symptoms: formData.symptoms,
      water_source: formData.water_source,
      submitted_via: 'SMS' as const,
      created_at: new Date().toISOString(),
      asha_id: profile.user_id
    };

    saveOfflineReport(offlineReport);
    
    toast({
      title: t('messages.success'),
      description: t('offline.smsReportSaved')
    });

    setFormData({
      patient_name: '',
      village: profile?.village || '',
      symptoms: '',
      water_source: ''
    });
    
    setSmsDialogOpen(false);
    setSmsLoading(false);
  };

  const fetchAlerts = async () => {
    if (!profile?.role) return;

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .contains('target_roles', [profile.role])
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

  const symptomsOptions = [
    { key: 'diarrhea', label: t('symptoms.diarrhea') },
    { key: 'vomiting', label: t('symptoms.vomiting') },
    { key: 'fever', label: t('symptoms.fever') },
    { key: 'stomachPain', label: t('symptoms.stomachPain') },
    { key: 'dehydration', label: t('symptoms.dehydration') },
    { key: 'skinRash', label: t('symptoms.skinRash') },
    { key: 'eyeInfection', label: t('symptoms.eyeInfection') },
    { key: 'typhoid', label: t('symptoms.typhoid') },
    { key: 'cholera', label: t('symptoms.cholera') },
    { key: 'hepatitis', label: t('symptoms.hepatitis') }
  ];

  const waterSourceOptions = [
    { key: 'tubeWell', label: t('waterSources.tubeWell') },
    { key: 'handPump', label: t('waterSources.handPump') },
    { key: 'openWell', label: t('waterSources.openWell') },
    { key: 'riverStream', label: t('waterSources.riverStream') },
    { key: 'pond', label: t('waterSources.pond') },
    { key: 'tankWater', label: t('waterSources.tankWater') },
    { key: 'bottledWater', label: t('waterSources.bottledWater') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('roles.asha')} {t('dashboard.overview')}</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* SMS Fallback Reporting */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                SMS Fallback Reporting
              </CardTitle>
              <CardDescription>
                Submit reports via SMS format when offline: REPORT &lt;Name&gt; &lt;Village&gt; &lt;Symptom&gt; &lt;WaterSource&gt;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-input">SMS Format Input</Label>
                  <Textarea
                    id="sms-input"
                    placeholder="Example: REPORT Rina Bora VillageA Diarrhea Handpump"
                    value={smsInputText}
                    onChange={(e) => setSmsInputText(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleSMSFallbackSubmit} 
                  disabled={smsParseLoading || !smsInputText.trim()}
                  className="w-full"
                >
                  {smsParseLoading ? 'Processing SMS...' : 'Submit SMS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                {t('asha.submitHealthReport')}
              </CardTitle>
              <CardDescription>
                {t('asha.reportHealthCases')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">{t('forms.patientName')}</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">{t('auth.village')}</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">{t('forms.symptoms')}</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, symptoms: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('asha.selectSymptoms')} />
                    </SelectTrigger>
                    <SelectContent>
                      {symptomsOptions.map((symptom) => (
                        <SelectItem key={symptom.key} value={symptom.label}>
                          {symptom.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water_source">{t('forms.waterSource', { defaultValue: 'Water Source' })}</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, water_source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('asha.selectWaterSource')} />
                    </SelectTrigger>
                    <SelectContent>
                      {waterSourceOptions.map((source) => (
                        <SelectItem key={source.key} value={source.label}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? t('asha.submitting') : t('asha.submitReport')}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSMSMode}
                    disabled={loading}
                    className="w-full flex items-center gap-2"
                  >
                    <WifiOff className="h-4 w-4" />
                    {t('offline.smsMode')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t('asha.myReports')} ({reports.length})
              </CardTitle>
              <CardDescription>
                {t('asha.submittedReports')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('asha.noReportsYet')}
                  </p>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{report.patient_name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('auth.village')}: {report.village}</p>
                      <p className="text-sm">
                        <span className="font-medium text-destructive">{t('asha.symptomsLabel')}</span> {report.symptoms}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-primary">{t('asha.waterSourceLabel')}</span> {report.water_source}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {t('asha.alerts')}
              </CardTitle>
              <CardDescription>
                {t('asha.importantAlerts')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`border rounded p-2 text-sm ${alert.auto ? 'border-orange-200 bg-orange-50' : ''}`}>
                    <p>{alert.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                      {alert.auto && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {t('asha.aiPredicted')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {t('asha.noAlertsYet')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SMS Preview Dialog */}
        <SMSPreviewDialog
          open={smsDialogOpen}
          onOpenChange={setSmsDialogOpen}
          smsContent={smsContent}
          onConfirm={handleSMSOfflineSubmit}
          loading={smsLoading}
        />
      </div>
    </div>
  );
};

export default AshaWorker;