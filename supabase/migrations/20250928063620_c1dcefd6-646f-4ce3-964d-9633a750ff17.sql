-- Create education content table
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role user_role NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback/complaint table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  village TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for education table
CREATE POLICY "Users can view education content for their role" 
ON public.education 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.role = education.target_role OR education.target_role = 'community')
  )
);

CREATE POLICY "Officials can manage education content" 
ON public.education 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'official'::user_role
  )
);

-- Create policies for feedback table
CREATE POLICY "Users can create their own feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view their own feedback" 
ON public.feedback 
FOR SELECT 
USING (auth.uid() = submitted_by);

CREATE POLICY "Officials can view all feedback" 
ON public.feedback 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'official'::user_role
  )
);

CREATE POLICY "Officials can update feedback status and response" 
ON public.feedback 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'official'::user_role
  )
);

-- Create trigger for education table
CREATE TRIGGER update_education_updated_at
BEFORE UPDATE ON public.education
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for feedback table
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample education content
INSERT INTO public.education (title, content, target_role, category, priority) VALUES
('Safe Water Practices', 'Always boil water for at least 1 minute before drinking. Store boiled water in clean, covered containers. Use only treated water for cooking and drinking.', 'villager', 'water_safety', 1),
('Hand Hygiene', 'Wash hands frequently with soap and clean water for at least 20 seconds. Always wash hands before eating, after using the toilet, and after handling potentially contaminated objects.', 'villager', 'hygiene', 1),
('Water Source Protection', 'Keep water sources clean by avoiding washing clothes or bathing near wells. Ensure proper drainage around water sources to prevent contamination.', 'villager', 'water_safety', 2),
('Recognizing Water-borne Diseases', 'Common symptoms include diarrhea, vomiting, fever, and stomach pain. Seek immediate medical attention if symptoms persist for more than 24 hours.', 'community', 'health_awareness', 1),
('Community Health Education', 'Organize regular health awareness sessions in your community. Share knowledge about preventive measures and encourage healthy practices among neighbors.', 'community', 'community_engagement', 1),
('Seasonal Health Precautions', 'During monsoon season, be extra cautious with water quality. Increase water treatment frequency and avoid consuming raw vegetables and fruits from unknown sources.', 'community', 'seasonal_health', 2);