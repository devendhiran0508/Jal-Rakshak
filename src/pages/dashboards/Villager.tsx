import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Home, AlertTriangle, Droplets, Activity, LogOut, Thermometer, TestTube } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';

interface Alert {
  id: string;
  message: string;
  target_roles: string[];
  created_at: string;
}

interface SensorReading {
  id: string;
  village: string;
  ph: number;
  turbidity: number;
  created_at: string;
}

const Villager: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);

  useEffect(() => {
    fetchAlerts();
    fetchSensorReadings();
    
    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('villager-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          if (newAlert.target_roles.includes('villager')) {
            setAlerts(current => [newAlert, ...current]);
          }
        }
      )
      .subscribe();

    const sensorsChannel = supabase
      .channel('sensor-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensors'
        },
        (payload) => {
          setSensorReadings(current => [payload.new as SensorReading, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(sensorsChannel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .contains('target_roles', ['villager'])
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

  const fetchSensorReadings = async () => {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sensor readings",
        variant: "destructive"
      });
    } else {
      setSensorReadings(data || []);
    }
  };

  const getWaterQualityStatus = (ph: number, turbidity: number) => {
    const phOk = ph >= 6.5 && ph <= 8.5;
    const turbidityOk = turbidity <= 5;
    
    if (phOk && turbidityOk) {
      return { status: 'Good', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
    } else if ((!phOk && (ph >= 6.0 && ph <= 9.0)) || (!turbidityOk && turbidity <= 10)) {
      return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' };
    } else {
      return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    }
  };

  const latestReadings = sensorReadings.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-primary mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('roles.villager')} {t('dashboard.overview')}</h1>
              <p className="text-muted-foreground">{t('dashboard.welcome')}, {profile?.name} from {profile?.village}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Water Quality Sensors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Water Quality Monitoring
              </CardTitle>
              <CardDescription>
                Real-time water quality data from sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestReadings.length === 0 ? (
                  <div className="text-center py-8">
                    <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sensor data available</p>
                    <p className="text-sm text-muted-foreground">Sensors will be deployed soon</p>
                  </div>
                ) : (
                  latestReadings.map((reading) => {
                    const quality = getWaterQualityStatus(reading.ph, reading.turbidity);
                    return (
                      <div key={reading.id} className={`border rounded-lg p-4 ${quality.bgColor}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{reading.village}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reading.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${quality.color}`}>
                            {quality.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <TestTube className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">pH Level</p>
                              <p className="text-sm text-muted-foreground">{reading.ph}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Thermometer className="h-4 w-4 text-secondary" />
                            <div>
                              <p className="text-sm font-medium">Turbidity</p>
                              <p className="text-sm text-muted-foreground">{reading.turbidity} NTU</p>
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

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Health Alerts ({alerts.length})
              </CardTitle>
              <CardDescription>
                Important alerts from health officials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No alerts at this time</p>
                    <p className="text-sm text-muted-foreground">Stay safe and healthy!</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border-l-4 border-destructive bg-destructive/5 p-4 rounded-r-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Water Quality Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Water Quality Guidelines</CardTitle>
            <CardDescription>Understanding water quality parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <TestTube className="h-4 w-4 mr-2 text-primary" />
                  pH Levels
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Good (6.5 - 8.5)</span>
                    <span className="text-green-600 font-medium">Safe to drink</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fair (6.0 - 6.4, 8.6 - 9.0)</span>
                    <span className="text-yellow-600 font-medium">Treat before use</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poor (&lt; 6.0, &gt; 9.0)</span>
                    <span className="text-red-600 font-medium">Not safe</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Thermometer className="h-4 w-4 mr-2 text-secondary" />
                  Turbidity (NTU)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Good (&lt; 5)</span>
                    <span className="text-green-600 font-medium">Clear water</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fair (5 - 10)</span>
                    <span className="text-yellow-600 font-medium">Slightly cloudy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poor (&gt; 10)</span>
                    <span className="text-red-600 font-medium">Very cloudy</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Villager;