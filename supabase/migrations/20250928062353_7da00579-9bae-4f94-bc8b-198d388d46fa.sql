-- Allow system-generated alerts (auto=true) to be created
CREATE POLICY "System can create auto alerts"
ON public.alerts
FOR INSERT
WITH CHECK (auto = true);