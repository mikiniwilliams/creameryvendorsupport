
-- Create ticket_activity table
CREATE TABLE public.ticket_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_activity ENABLE ROW LEVEL SECURITY;

-- Same visibility as tickets: vendor users see their vendor's ticket activity, admins see all
CREATE POLICY "Vendor users can view their ticket activity" ON public.ticket_activity
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id AND t.vendor_id = public.get_user_vendor_id(auth.uid())
  )
);

CREATE POLICY "Admins can view all ticket activity" ON public.ticket_activity
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_ticket_activity_ticket ON public.ticket_activity (ticket_id, created_at);

-- Trigger: log status changes
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_change', OLD.priority, NEW.priority);
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignment_change', OLD.assigned_to::text, NEW.assigned_to::text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_update_log
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_status_change();

-- Trigger: log ticket creation
CREATE OR REPLACE FUNCTION public.log_ticket_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, new_value)
  VALUES (NEW.id, NEW.created_by, 'created', NEW.status);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_created_log
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_created();

-- Trigger: log new comments as activity
CREATE OR REPLACE FUNCTION public.log_comment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, new_value)
  VALUES (NEW.ticket_id, NEW.user_id, 'comment', LEFT(NEW.content, 100));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created_log
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_comment_activity();
