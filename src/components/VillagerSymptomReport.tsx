import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { User, MessageSquare, Save } from 'lucide-react';
import SMSPreviewDialog from './SMSPreviewDialog';
import { saveOfflineReport, isOnline } from '@/utils/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

const VillagerSymptomReport: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsContent, setSmsContent] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: '',
    age: '',
    village: profile?.village || '',
    symptoms: ''
  });

  const symptomsOptions = [
    { key: 'diarrhea', label: t('symptoms.diarrhea') },
    { key: 'vomiting', label: t('symptoms.vomiting') },
    { key: 'fever', label: t('symptoms.fever') },
    { key: 'stomachPain', label: t('symptoms.stomachPain') },
    { key: 'dehydration', label: t('symptoms.dehydration') },
    { key: 'skinRash', label: t('symptoms.skinRash') },
    { key: 'eyeInfection', label: t('symptoms.eyeInfection') }
  ];

  const generateSMSContent = () => {
    const currentTime = new Date().toLocaleString();
    return `[VILLAGER HEALTH REPORT]
Name: ${formData.patient_name}
Age: ${formData.age}
Village: ${formData.village}
Symptoms: ${formData.symptoms}
Time: ${currentTime}
[Please process this villager report]`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setLoading(true);

    try {
      if (isOnline()) {
        // Try to submit online first
        const { error } = await supabase
          .from('reports')
          .insert([
            {
              patient_name: formData.patient_name,
              village: formData.village,
              symptoms: formData.symptoms,
              water_source: 'Unknown', // Default for villager reports
              submitted_via: 'online_villager',
              asha_id: profile.user_id // Use villager ID as asha_id for tracking
            }
          ]);

        if (error) {
          throw error;
        }

        toast({
          title: t('messages.success'),
          description: t('asha.reportSubmitted')
        });
      } else {
        throw new Error('Offline mode');
      }
    } catch (error) {
      // Save offline if online submission fails or if offline
      const offlineReport = {
        id: `villager_${Date.now()}_${Math.random()}`,
        patient_name: formData.patient_name,
        village: formData.village,
        symptoms: formData.symptoms,
        water_source: 'Unknown',
        submitted_via: 'offline_villager' as const,
        created_at: new Date().toISOString(),
        asha_id: profile?.user_id,
        age: parseInt(formData.age) || 0
      };

      saveOfflineReport(offlineReport);
      
      toast({
        title: t('messages.success'),
        description: t('offline.offlineReportSaved')
      });
    }

    setFormData({
      patient_name: '',
      age: '',
      village: profile?.village || '',
      symptoms: ''
    });

    setLoading(false);
  };

  const handleSMSMode = () => {
    if (!formData.patient_name || !formData.symptoms) {
      toast({
        title: t('messages.error'),
        description: "Please fill in name and symptoms",
        variant: "destructive"
      });
      return;
    }
    
    const content = generateSMSContent();
    setSmsContent(content);
    setSmsDialogOpen(true);
  };

  const handleSMSSubmit = () => {
    if (!profile?.user_id) return;

    setSmsLoading(true);
    
    const offlineReport = {
      id: `sms_villager_${Date.now()}_${Math.random()}`,
      patient_name: formData.patient_name,
      village: formData.village,
      symptoms: formData.symptoms,
      water_source: 'Unknown',
      submitted_via: 'SMS_villager' as const,
      created_at: new Date().toISOString(),
      asha_id: profile.user_id,
      age: parseInt(formData.age) || 0
    };

    saveOfflineReport(offlineReport);
    
    toast({
      title: t('messages.success'),
      description: t('offline.smsReportSaved')
    });

    setFormData({
      patient_name: '',
      age: '',
      village: profile?.village || '',
      symptoms: ''
    });
    
    setSmsDialogOpen(false);
    setSmsLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {t('offline.basicSymptomReport')}
          </CardTitle>
          <CardDescription>
            {t('offline.villagerReport')}
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
              <Label htmlFor="age">{t('forms.age')}</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
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
              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('asha.submitting') : t('asha.submitReport')}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSMSMode}
                disabled={loading}
                className="w-full flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {t('offline.smsMode')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SMSPreviewDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsContent={smsContent}
        onConfirm={handleSMSSubmit}
        loading={smsLoading}
      />
    </>
  );
};

export default VillagerSymptomReport;