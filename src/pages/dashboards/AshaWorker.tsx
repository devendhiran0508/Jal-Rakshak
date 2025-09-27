import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Heart, Plus, FileText, LogOut } from 'lucide-react';

interface Report {
  id: string;
  patient_name: string;
  village: string;
  symptoms: string;
  water_source: string;
  created_at: string;
}

const AshaWorker: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_name: '',
    village: profile?.village || '',
    symptoms: '',
    water_source: ''
  });

  useEffect(() => {
    fetchReports();
    
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const fetchReports = async () => {
    if (!profile?.user_id) return;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('asha_id', profile.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reports",
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

    const { error } = await supabase
      .from('reports')
      .insert([
        {
          asha_id: profile.user_id,
          patient_name: formData.patient_name,
          village: formData.village,
          symptoms: formData.symptoms,
          water_source: formData.water_source
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Health report submitted successfully"
      });
      setFormData({
        patient_name: '',
        village: profile?.village || '',
        symptoms: '',
        water_source: ''
      });
    }

    setLoading(false);
  };

  const symptomsOptions = [
    'Diarrhea',
    'Vomiting',
    'Fever',
    'Stomach Pain',
    'Dehydration',
    'Skin Rash',
    'Eye Infection',
    'Typhoid',
    'Cholera',
    'Hepatitis'
  ];

  const waterSourceOptions = [
    'Tube Well',
    'Hand Pump',
    'Open Well',
    'River/Stream',
    'Pond',
    'Tank Water',
    'Bottled Water'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary">ASHA Worker Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {profile?.name}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Submit Health Report
              </CardTitle>
              <CardDescription>
                Report health cases in your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient Name</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, symptoms: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select symptoms" />
                    </SelectTrigger>
                    <SelectContent>
                      {symptomsOptions.map((symptom) => (
                        <SelectItem key={symptom} value={symptom}>
                          {symptom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="water_source">Water Source</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, water_source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select water source" />
                    </SelectTrigger>
                    <SelectContent>
                      {waterSourceOptions.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                My Reports ({reports.length})
              </CardTitle>
              <CardDescription>
                Your submitted health reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No reports submitted yet
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
                      <p className="text-sm text-muted-foreground">Village: {report.village}</p>
                      <p className="text-sm">
                        <span className="font-medium text-destructive">Symptoms:</span> {report.symptoms}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-primary">Water Source:</span> {report.water_source}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AshaWorker;