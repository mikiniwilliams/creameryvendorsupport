
DROP POLICY IF EXISTS "System insert ticket activity" ON public.ticket_activity;
CREATE POLICY "Deny direct insert ticket activity" ON public.ticket_activity FOR INSERT TO authenticated
  WITH CHECK (false);
