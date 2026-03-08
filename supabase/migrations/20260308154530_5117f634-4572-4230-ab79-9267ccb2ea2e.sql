
-- Fix vendor SELECT: allow seeing tickets they created OR are assigned to
DROP POLICY IF EXISTS "Vendor view own tickets" ON public.tickets;
CREATE POLICY "Vendor view own tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    (vendor_id = get_user_vendor_id(auth.uid()))
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
    AND is_active_user(auth.uid())
  );

-- Fix vendor UPDATE: allow updating tickets they created OR are assigned to
DROP POLICY IF EXISTS "Vendor update own tickets" ON public.tickets;
CREATE POLICY "Vendor update own tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    (vendor_id = get_user_vendor_id(auth.uid()))
    AND (created_by = auth.uid() OR assigned_to = auth.uid())
    AND is_active_user(auth.uid())
  );

-- Fix comments: allow viewing/creating comments on tickets the user created or is assigned to
DROP POLICY IF EXISTS "View comments on accessible tickets" ON public.comments;
CREATE POLICY "View comments on accessible tickets" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = comments.ticket_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR (t.vendor_id = get_user_vendor_id(auth.uid()) AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Create comments on accessible tickets" ON public.comments;
CREATE POLICY "Create comments on accessible tickets" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_active_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = comments.ticket_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR (t.vendor_id = get_user_vendor_id(auth.uid()) AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid()))
      )
    )
  );

-- Fix ticket activity: allow viewing activity on assigned tickets
DROP POLICY IF EXISTS "Vendor view own ticket activity" ON public.ticket_activity;
CREATE POLICY "Vendor view own ticket activity" ON public.ticket_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_activity.ticket_id
      AND t.vendor_id = get_user_vendor_id(auth.uid())
      AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
    )
  );

-- Add notification trigger for ticket assignment
CREATE OR REPLACE FUNCTION public.notify_ticket_assignment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only fire when assigned_to changes to a non-null value
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
    VALUES (
      NEW.assigned_to,
      'Ticket Assigned to You',
      'You have been assigned to ticket: "' || NEW.title || '"',
      NEW.id,
      'assignment'
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_ticket_assignment_trigger
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_assignment();

-- Also notify on initial insert with assignment
CREATE OR REPLACE FUNCTION public.notify_ticket_assignment_on_create()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
    VALUES (
      NEW.assigned_to,
      'Ticket Assigned to You',
      'You have been assigned to ticket: "' || NEW.title || '"',
      NEW.id,
      'assignment'
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_ticket_assignment_on_create_trigger
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_assignment_on_create();
