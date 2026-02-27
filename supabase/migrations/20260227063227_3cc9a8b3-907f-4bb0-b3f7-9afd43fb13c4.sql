-- Allow admins to delete any comment for moderation
CREATE POLICY "Admins can delete comments"
  ON public.comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny UPDATE on ticket_activity (immutable audit trail)
CREATE POLICY "Deny update on ticket_activity"
  ON public.ticket_activity FOR UPDATE
  USING (false);

-- Explicitly deny DELETE on ticket_activity (immutable audit trail)
CREATE POLICY "Deny delete on ticket_activity"
  ON public.ticket_activity FOR DELETE
  USING (false);
