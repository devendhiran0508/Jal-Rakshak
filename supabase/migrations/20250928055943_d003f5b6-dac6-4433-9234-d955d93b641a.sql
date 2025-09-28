-- Add new columns to alerts table for outbreak prediction
ALTER TABLE public.alerts 
ADD COLUMN village text,
ADD COLUMN type text,
ADD COLUMN disease_or_parameter text,
ADD COLUMN value numeric,
ADD COLUMN auto boolean DEFAULT false;

-- Create index for better performance on outbreak queries
CREATE INDEX idx_alerts_village_type ON public.alerts(village, type, created_at);
CREATE INDEX idx_alerts_auto ON public.alerts(auto, created_at);
CREATE INDEX idx_reports_village_symptoms_date ON public.reports(village, symptoms, created_at);
CREATE INDEX idx_sensors_village_date ON public.sensors(village, created_at);