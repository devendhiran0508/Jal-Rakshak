-- Add submitted_via field to reports table
ALTER TABLE public.reports 
ADD COLUMN submitted_via text NOT NULL DEFAULT 'online';

-- Add comment to describe the field
COMMENT ON COLUMN public.reports.submitted_via IS 'How the report was submitted: online, SMS, offline_villager, SMS_villager';

-- Create index for better performance on submitted_via queries
CREATE INDEX idx_reports_submitted_via ON public.reports(submitted_via);