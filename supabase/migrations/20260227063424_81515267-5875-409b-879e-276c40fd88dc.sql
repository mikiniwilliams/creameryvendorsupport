CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
