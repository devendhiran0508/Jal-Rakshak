import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, BarChart3, Users, LogOut, Plus } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';

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
}

const HealthOfficial: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertForm, setAlertForm] = useState({
    message: '',
    target_roles: [] as UserRole[]
  });

  useEffect(() => {
    fetchReports();
    fetchAlerts();
    
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
          setAlerts(current => [payload.new as Alert, ...current]);
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
        title: "Error",
        description: "Failed to fetch reports",
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
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive"
      });
    } else {
      setAlerts(data || []);
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
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Alert created successfully"
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
              <h1 className="text-2xl font-bold text-primary">Health Official Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {profile?.name}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Villages</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(villageData).length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Disease Distribution</CardTitle>
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
              <CardTitle>Cases by Village</CardTitle>
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
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest health reports from ASHA workers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead>Symptoms</TableHead>
                      <TableHead>Date</TableHead>
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
                Create Alert
              </CardTitle>
              <CardDescription>Send alerts to specific user groups</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Alert Message</Label>
                  <Input
                    id="message"
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    placeholder="Enter alert message..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Roles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['community', 'villager'] as UserRole[]).map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={alertForm.target_roles.includes(role) ? "default" : "outline"}
                        onClick={() => toggleRole(role)}
                        className="capitalize"
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading || alertForm.target_roles.length === 0} className="w-full">
                  {loading ? 'Creating...' : 'Create Alert'}
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Recent Alerts</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="border rounded p-2 text-sm">
                      <p>{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        To: {alert.target_roles.join(', ')} • {new Date(alert.created_at).toLocaleDateString()}
                      </p>
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