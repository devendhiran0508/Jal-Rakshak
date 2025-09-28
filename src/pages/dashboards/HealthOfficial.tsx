import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, BarChart3, Users, LogOut, Plus, Brain } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import LanguageToggle from '@/components/LanguageToggle';

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

const HealthOfficial: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictedOutbreaks, setPredictedOutbreaks] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertForm, setAlertForm] = useState({
    message: '',
    target_roles: [] as UserRole[]
  });

  useEffect(() => {
    fetchReports();
    fetchAlerts();
    fetchPredictedOutbreaks();
    
    // Set up real-time subscriptions
    const reportsChannel = supabase
      .channel('all-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          setReports(current => [payload.new as Report, ...current]);
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('all-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          setAlerts(current => [newAlert, ...current]);
          if (newAlert.auto) {
            setPredictedOutbreaks(current => [newAlert, ...current]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
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

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
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

  const fetchPredictedOutbreaks = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('auto', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('messages.error'),
        description: "Failed to fetch predicted outbreaks",
        variant: "destructive"
      });
    } else {
      setPredictedOutbreaks(data || []);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id || alertForm.target_roles.length === 0) return;

    setLoading(true);

    const { error } = await supabase
      .from('alerts')
      .insert([
        {
          created_by: profile.user_id,
          message: alertForm.message,
          target_roles: alertForm.target_roles
        }
      ]);

    if (error) {
      toast({
        title: t('messages.error'),
        description: t('official.errorCreateAlert'),
        variant: "destructive"
      });
    } else {
      toast({
        title: t('messages.success'),
        description: t('official.alertCreated')
      });
      setAlertForm({ message: '', target_roles: [] });
    }

    setLoading(false);
  };

  // Prepare chart data
  const symptomsData = reports.reduce((acc, report) => {
    acc[report.symptoms] = (acc[report.symptoms] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const villageData = reports.reduce((acc, report) => {
    acc[report.village] = (acc[report.village] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(symptomsData).map(([symptom, count]) => ({
    name: symptom,
    value: count
  }));

  const barData = Object.entries(villageData).map(([village, count]) => ({
    village,
    cases: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const toggleRole = (role: UserRole) => {
    setAlertForm(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('roles.official')} {t('dashboard.overview')}</h1>
              <p className="text-muted-foreground">{t('dashboard.welcome')}, {profile?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Button onClick={signOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.logout')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalReports')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.activeAlerts')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('official.affectedVillages')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(villageData).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Predicted Outbreaks Section */}
        {predictedOutbreaks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-orange-500" />
                {t('official.predictedOutbreaks')}
              </CardTitle>
              <CardDescription>{t('official.aiDetectedAlerts')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {predictedOutbreaks.slice(0, 10).map((outbreak) => (
                  <div key={outbreak.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900">{outbreak.message}</p>
                        {outbreak.village && (
                          <p className="text-xs text-orange-700 mt-1">
                            {t('auth.village')}: {outbreak.village}
                          </p>
                        )}
                        {outbreak.disease_or_parameter && (
                          <p className="text-xs text-orange-700">
                            {t('official.parameter')}: {outbreak.disease_or_parameter}
                            {outbreak.value && ` (${outbreak.value})`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {outbreak.type === 'disease_cluster' && t('official.diseaseCluster')}
                          {outbreak.type === 'water_quality' && t('official.waterQuality')}
                          {outbreak.type === 'seasonal' && t('official.seasonal')}
                        </span>
                        <p className="text-xs text-orange-600 mt-1">
                          {new Date(outbreak.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>{t('official.diseaseDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('official.casesByVillage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="village" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cases" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('official.recentReports')}</CardTitle>
              <CardDescription>{t('official.latestReports')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('official.patient')}</TableHead>
                      <TableHead>{t('auth.village')}</TableHead>
                      <TableHead>{t('forms.symptoms')}</TableHead>
                      <TableHead>{t('official.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.patient_name}</TableCell>
                        <TableCell>{report.village}</TableCell>
                        <TableCell className="text-destructive">{report.symptoms}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Create Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                {t('official.createAlert')}
              </CardTitle>
              <CardDescription>{t('official.sendAlertsToGroups')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">{t('official.alertMessage')}</Label>
                  <Input
                    id="message"
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    placeholder={t('official.enterMessage')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('official.targetRoles')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['community', 'villager'] as UserRole[]).map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={alertForm.target_roles.includes(role) ? "default" : "outline"}
                        onClick={() => toggleRole(role)}
                        className="capitalize"
                      >
                        {t(`roles.${role}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading || alertForm.target_roles.length === 0} className="w-full">
                  {loading ? t('official.creating') : t('official.createAlert')}
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="font-medium mb-2">{t('official.recentAlerts')}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className={`border rounded p-2 text-sm ${alert.auto ? 'border-orange-200 bg-orange-50' : ''}`}>
                      <p>{alert.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          To: {alert.target_roles.join(', ')} • {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                        {alert.auto && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {t('official.aiGenerated')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HealthOfficial;