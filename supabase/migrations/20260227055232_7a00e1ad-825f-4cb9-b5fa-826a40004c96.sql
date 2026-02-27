
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- System can insert notifications (via trigger with security definer)
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Function to notify on ticket status change
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_title TEXT;
  v_vendor_id UUID;
  profile_record RECORD;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  ticket_title := NEW.title;
  v_vendor_id := NEW.vendor_id;

  -- Notify the ticket creator
  IF NEW.created_by IS NOT NULL AND NEW.created_by != auth.uid() THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      NEW.created_by,
      'Ticket Status Updated',
      'Ticket "' || ticket_title || '" status changed to ' || REPLACE(NEW.status, '_', ' '),
      NEW.id
    );
  END IF;

  -- Notify the assigned admin (if different from who made the change)
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != auth.uid() AND NEW.assigned_to != NEW.created_by THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      NEW.assigned_to,
      'Ticket Status Updated',
      'Ticket "' || ticket_title || '" status changed to ' || REPLACE(NEW.status, '_', ' '),
      NEW.id
    );
  END IF;

  -- Notify all vendor users associated with this vendor (except the one who made the change)
  FOR profile_record IN
    SELECT user_id FROM public.profiles
    WHERE vendor_id = v_vendor_id AND user_id != auth.uid() AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      profile_record.user_id,
      'Ticket Status Updated',
      'Ticket "' || ticket_title || '" status changed to ' || REPLACE(NEW.status, '_', ' '),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_status_change();

-- Function to notify on new comment
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_record RECORD;
  profile_record RECORD;
BEGIN
  SELECT id, title, vendor_id, created_by, assigned_to
  INTO ticket_record
  FROM public.tickets WHERE id = NEW.ticket_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Notify ticket creator (if not the commenter)
  IF ticket_record.created_by IS NOT NULL AND ticket_record.created_by != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      ticket_record.created_by,
      'New Comment',
      'New comment on "' || ticket_record.title || '"',
      ticket_record.id
    );
  END IF;

  -- Notify assigned admin (if not the commenter and not the creator)
  IF ticket_record.assigned_to IS NOT NULL
     AND ticket_record.assigned_to != NEW.user_id
     AND ticket_record.assigned_to != ticket_record.created_by THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      ticket_record.assigned_to,
      'New Comment',
      'New comment on "' || ticket_record.title || '"',
      ticket_record.id
    );
  END IF;

  -- Notify other vendor users
  FOR profile_record IN
    SELECT user_id FROM public.profiles
    WHERE vendor_id = ticket_record.vendor_id
      AND user_id != NEW.user_id
      AND user_id != ticket_record.created_by
  LOOP
    INSERT INTO public.notifications (user_id, title, message, ticket_id)
    VALUES (
      profile_record.user_id,
      'New Comment',
      'New comment on "' || ticket_record.title || '"',
      ticket_record.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
