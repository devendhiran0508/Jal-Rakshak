-- Create community_reports table for villager issue reporting
CREATE TABLE public.community_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_type TEXT NOT NULL,
  description TEXT,
  village TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for community reports
CREATE POLICY "Users can create their own community reports" 
ON public.community_reports 
FOR INSERT 
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view their own community reports" 
ON public.community_reports 
FOR SELECT 
USING (auth.uid() = submitted_by);

CREATE POLICY "Health officials can view all community reports" 
ON public.community_reports 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'official'::user_role))));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_community_reports_updated_at
BEFORE UPDATE ON public.community_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();