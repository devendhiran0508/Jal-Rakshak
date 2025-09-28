import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';

interface Report {
  id: string;
  village: string;
  symptoms: string;
  created_at: string;
  patient_name: string;
}

interface VillageData {
  village: string;
  caseCount: number;
  mostCommonSymptom: string;
  coordinates: [number, number];
  riskLevel: 'low' | 'medium' | 'high';
}

// Sample coordinates for Assam villages (for demo purposes)
const VILLAGE_COORDINATES: Record<string, [number, number]> = {
  'Guwahati': [26.1445, 91.7362],
  'Dibrugarh': [27.4728, 94.9120],
  'Silchar': [24.8333, 92.7789],
  'Jorhat': [26.7509, 94.2037],
  'Nagaon': [26.3489, 92.6840],
  'Tinsukia': [27.4870, 95.3597],
  'Bongaigaon': [26.4831, 90.5526],
  'Dhubri': [26.0192, 89.9747],
  'Goalpara': [26.1664, 90.6176],
  'Kokrajhar': [26.4018, 90.2719],
  'Karimganj': [24.8696, 92.3610],
  'Hailakandi': [24.6843, 92.5694],
  'Cachar': [24.8000, 92.8000],
  'Kamrup': [26.2006, 91.6936],
  'Darrang': [26.4544, 92.0417]
};

const DiseaseHotspotsMap: React.FC = () => {
  const { t } = useTranslation();
  const [villageData, setVillageData] = useState<VillageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotspotData();

    // Set up real-time subscription
    const channel = supabase
      .channel('hotspot-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchHotspotData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHotspotData = async () => {
    try {
      // Get reports from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      // Group by village and calculate metrics
      const villageMap = new Map<string, { 
        cases: Report[], 
        symptoms: Record<string, number> 
      }>();

      reports?.forEach((report: Report) => {
        const village = report.village;
        if (!villageMap.has(village)) {
          villageMap.set(village, { cases: [], symptoms: {} });
        }
        
        const villageInfo = villageMap.get(village)!;
        villageInfo.cases.push(report);
        villageInfo.symptoms[report.symptoms] = (villageInfo.symptoms[report.symptoms] || 0) + 1;
      });

      // Convert to VillageData array
      const processedData: VillageData[] = Array.from(villageMap.entries()).map(([village, data]) => {
        const caseCount = data.cases.length;
        const mostCommonSymptom = Object.entries(data.symptoms)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

        // Determine risk level based on case count
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (caseCount > 5) riskLevel = 'high';
        else if (caseCount >= 3) riskLevel = 'medium';

        // Get coordinates (use default if not found)
        const coordinates = VILLAGE_COORDINATES[village] || [26.2006, 91.6936];

        return {
          village,
          caseCount,
          mostCommonSymptom,
          coordinates,
          riskLevel
        };
      });

      setVillageData(processedData);
    } catch (error) {
      console.error('Error processing hotspot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive'
    } as const;

    const labels = {
      low: t('map.lowRisk'),
      medium: t('map.mediumRisk'),
      high: t('map.highRisk')
    };

    return (
      <Badge variant={variants[riskLevel]}>
        {labels[riskLevel]}
      </Badge>
    );
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {t('map.diseaseHotspots')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {t('map.diseaseHotspots')}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-1" />
            {t('map.last7Days')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Village Data Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {villageData.map((village) => (
            <div
              key={village.village}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getRiskColor(village.riskLevel)}`}></div>
                  {village.village}
                </h3>
                {getRiskLevelBadge(village.riskLevel)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('map.cases')}:</span>
                  <span className="font-medium text-lg">{village.caseCount}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">{t('map.commonSymptom')}:</span>
                  <span className="font-medium text-right max-w-32 text-sm">{village.mostCommonSymptom}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coordinates:</span>
                  <span className="text-xs text-muted-foreground">
                    {village.coordinates[0].toFixed(4)}, {village.coordinates[1].toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {villageData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('map.cases')}: 0</p>
            <p className="text-sm text-muted-foreground mt-2">
              No disease hotspots detected in the last 7 days
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">{t('map.riskLevel')} Legend</h4>
          <div className="flex justify-center">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>{t('map.lowRisk')} (0-2)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>{t('map.mediumRisk')} (3-5)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>{t('map.highRisk')} (5+)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistical Summary */}
        {villageData.length > 0 && (
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{villageData.length}</div>
              <div className="text-sm text-muted-foreground">Affected Villages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {villageData.reduce((sum, v) => sum + v.caseCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {villageData.filter(v => v.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Risk Areas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {villageData.filter(v => v.riskLevel === 'medium').length}
              </div>
              <div className="text-sm text-muted-foreground">Medium Risk Areas</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiseaseHotspotsMap;