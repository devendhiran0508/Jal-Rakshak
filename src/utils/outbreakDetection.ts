import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OutbreakRule {
  village: string;
  type: 'disease_cluster' | 'water_quality' | 'seasonal';
  message: string;
  diseaseOrParameter?: string;
  value?: number;
  targetRoles: ('asha' | 'community' | 'official' | 'villager')[];
}

// Check for disease cluster outbreaks (Rule 1)
export const checkDiseaseClusterOutbreak = async (village: string, symptoms: string): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentReports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('village', village)
    .eq('symptoms', symptoms)
    .gte('created_at', twentyFourHoursAgo);

  if (error) {
    console.error('Error checking disease cluster:', error);
    return;
  }

  if (recentReports && recentReports.length >= 3) {
    const rule: OutbreakRule = {
      village,
      type: 'disease_cluster',
      message: `🚨 Disease outbreak detected: ${recentReports.length} cases of ${symptoms} in ${village} within 24 hours`,
      diseaseOrParameter: symptoms,
      value: recentReports.length,
      targetRoles: ['official', 'community', 'villager']
    };

    await createOutbreakAlert(rule);
  }
};

// Check for seasonal outbreak (Rule 3)
export const checkSeasonalOutbreak = async (village: string, symptoms: string): Promise<void> => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isMonsoonSeason = currentMonth >= 7 && currentMonth <= 9; // July-September

  if (!isMonsoonSeason) return;

  const isDiarrheaOrCholera = symptoms.toLowerCase().includes('diarrhea') || 
                              symptoms.toLowerCase().includes('cholera') ||
                              symptoms.toLowerCase().includes('loose motions') ||
                              symptoms.toLowerCase().includes('vomiting');

  if (!isDiarrheaOrCholera) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentReports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('village', village)
    .gte('created_at', twentyFourHoursAgo)
    .or(`symptoms.ilike.%diarrhea%,symptoms.ilike.%cholera%,symptoms.ilike.%loose motions%,symptoms.ilike.%vomiting%`);

  if (error) {
    console.error('Error checking seasonal outbreak:', error);
    return;
  }

  if (recentReports && recentReports.length >= 2) {
    const rule: OutbreakRule = {
      village,
      type: 'seasonal',
      message: `⚠️ Monsoon season alert: ${recentReports.length} cases of water-borne diseases in ${village}. High risk period (July-Sept)`,
      diseaseOrParameter: 'water-borne diseases',
      value: recentReports.length,
      targetRoles: ['official', 'community', 'villager']
    };

    await createOutbreakAlert(rule);
  }
};

// Check for water quality issues (Rule 2)
export const checkWaterQualityOutbreak = async (): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentSensors, error } = await supabase
    .from('sensors')
    .select('*')
    .gte('created_at', twentyFourHoursAgo)
    .or('ph.lt.6.5,turbidity.gt.5');

  if (error) {
    console.error('Error checking water quality:', error);
    return;
  }

  if (recentSensors && recentSensors.length > 0) {
    for (const sensor of recentSensors) {
      let alertMessage = '';
      let parameter = '';
      let value = 0;

      if (sensor.ph < 6.5) {
        alertMessage = `💧 Water quality alert: Acidic water detected in ${sensor.village} (pH: ${sensor.ph})`;
        parameter = 'pH';
        value = sensor.ph;
      } else if (sensor.turbidity > 5) {
        alertMessage = `💧 Water quality alert: High turbidity in ${sensor.village} (${sensor.turbidity} NTU)`;
        parameter = 'turbidity';
        value = sensor.turbidity;
      }

      const rule: OutbreakRule = {
        village: sensor.village,
        type: 'water_quality',
        message: alertMessage,
        diseaseOrParameter: parameter,
        value: value,
        targetRoles: ['official', 'community', 'villager']
      };

      // Check if we already have a recent alert for this village and parameter
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('*')
        .eq('village', sensor.village)
        .eq('disease_or_parameter', parameter)
        .eq('auto', true)
        .gte('created_at', twentyFourHoursAgo)
        .maybeSingle();

      if (!existingAlert) {
        await createOutbreakAlert(rule);
      }
    }
  }
};

// Create outbreak alert
const createOutbreakAlert = async (rule: OutbreakRule): Promise<void> => {
  try {
    // Get a system user ID (we'll use the first official user as creator)
    const { data: official, error: officialError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'official')
      .limit(1)
      .maybeSingle();

    const creatorId = official?.user_id || '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase
      .from('alerts')
      .insert([
        {
          created_by: creatorId,
          message: rule.message,
          target_roles: rule.targetRoles,
          village: rule.village,
          type: rule.type,
          disease_or_parameter: rule.diseaseOrParameter,
          value: rule.value,
          auto: true
        }
      ]);

    if (error) {
      console.error('Error creating outbreak alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to create outbreak alert',
        variant: 'destructive'
      });
    } else {
      console.log('Outbreak alert created:', rule.message);
    }
  } catch (error) {
    console.error('Error in createOutbreakAlert:', error);
  }
};

// Main function to run all outbreak detection rules
export const runOutbreakDetection = async (reportData?: { village: string; symptoms: string }): Promise<void> => {
  try {
    // Always check water quality
    await checkWaterQualityOutbreak();

    // If a new report was submitted, check disease-specific rules
    if (reportData) {
      await checkDiseaseClusterOutbreak(reportData.village, reportData.symptoms);
      await checkSeasonalOutbreak(reportData.village, reportData.symptoms);
    }
  } catch (error) {
    console.error('Error running outbreak detection:', error);
  }
};