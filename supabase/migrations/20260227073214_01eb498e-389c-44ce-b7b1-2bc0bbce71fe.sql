
-- Schema changes
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS vendor_website text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS issue_type text NOT NULL DEFAULT 'general';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text;

-- Helper: check if user is active
CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND status = 'active') $$;

-- Vendor request creation (onboarding)
CREATE OR REPLACE FUNCTION public.create_vendor_request(_vendor_name text, _vendor_website text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _vendor_id uuid; _existing uuid;
BEGIN
  SELECT vendor_id INTO _existing FROM public.profiles WHERE user_id = auth.uid();
  IF _existing IS NOT NULL THEN RAISE EXCEPTION 'Already associated with a vendor'; END IF;
  INSERT INTO public.vendors (name, vendor_website, status, created_by_user_id)
    VALUES (_vendor_name, _vendor_website, 'pending', auth.uid()) RETURNING id INTO _vendor_id;
  UPDATE public.profiles SET vendor_id = _vendor_id WHERE user_id = auth.uid();
  RETURN _vendor_id;
END; $$;

-- Admin: approve vendor
CREATE OR REPLACE FUNCTION public.approve_vendor(_vendor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.vendors SET status = 'active' WHERE id = _vendor_id;
  UPDATE public.profiles SET status = 'active' WHERE vendor_id = _vendor_id;
END; $$;

-- Admin: approve user
CREATE OR REPLACE FUNCTION public.approve_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.profiles SET status = 'active' WHERE user_id = _user_id;
END; $$;

-- Admin: disable vendor
CREATE OR REPLACE FUNCTION public.disable_vendor(_vendor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.vendors SET status = 'disabled' WHERE id = _vendor_id;
  UPDATE public.profiles SET status = 'disabled' WHERE vendor_id = _vendor_id;
END; $$;

-- Admin: disable user
CREATE OR REPLACE FUNCTION public.disable_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.profiles SET status = 'disabled' WHERE user_id = _user_id;
END; $$;

-- Update handle_new_user: set pending status, auto-assign vendor role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email, 'pending');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendor') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

-- Updated notification functions
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.created_by IS NOT NULL AND NEW.created_by != auth.uid() THEN
    INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
    VALUES (NEW.created_by, 'Ticket Status Updated',
      'Ticket "' || NEW.title || '" status changed to ' || REPLACE(NEW.status, '_', ' '),
      NEW.id, 'status_change');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t RECORD; a RECORD;
BEGIN
  SELECT id, title, created_by, assigned_to INTO t FROM public.tickets WHERE id = NEW.ticket_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF has_role(NEW.user_id, 'admin') THEN
    IF t.created_by IS NOT NULL AND t.created_by != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
      VALUES (t.created_by, 'Admin Comment', 'Admin commented on "' || t.title || '"', t.id, 'admin_comment');
    END IF;
  ELSE
    IF t.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
      VALUES (t.assigned_to, 'Vendor Comment', 'Vendor comment on "' || t.title || '"', t.id, 'vendor_comment');
    ELSE
      FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
        VALUES (a.user_id, 'Vendor Comment', 'Vendor comment on "' || t.title || '"', t.id, 'vendor_comment');
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE a RECORD;
BEGIN
  FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
    VALUES (a.user_id, 'New Ticket', 'New ticket: "' || NEW.title || '"', NEW.id, 'new_ticket');
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_ticket_created_notify ON public.tickets;
CREATE TRIGGER on_ticket_created_notify AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_new_ticket();

-- RLS: Tickets
DROP POLICY IF EXISTS "Vendor users can view their tickets" ON public.tickets;
DROP POLICY IF EXISTS "Vendor users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Vendor users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Vendor users can view own submitted tickets" ON public.tickets;
DROP POLICY IF EXISTS "Vendor users can update own submitted tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON public.tickets;

CREATE POLICY "Vendor view own tickets" ON public.tickets FOR SELECT TO authenticated
  USING (vendor_id = get_user_vendor_id(auth.uid()) AND created_by = auth.uid() AND is_active_user(auth.uid()));
CREATE POLICY "Vendor create tickets" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (vendor_id = get_user_vendor_id(auth.uid()) AND created_by = auth.uid() AND is_active_user(auth.uid()));
CREATE POLICY "Vendor update own tickets" ON public.tickets FOR UPDATE TO authenticated
  USING (vendor_id = get_user_vendor_id(auth.uid()) AND created_by = auth.uid() AND is_active_user(auth.uid()));
CREATE POLICY "Admin view all tickets" ON public.tickets FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update all tickets" ON public.tickets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert tickets" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete tickets" ON public.tickets FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS: Comments
DROP POLICY IF EXISTS "Users can view comments on accessible tickets" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tickets" ON public.comments;

CREATE POLICY "View comments on accessible tickets" ON public.comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = comments.ticket_id
    AND (has_role(auth.uid(), 'admin') OR (t.vendor_id = get_user_vendor_id(auth.uid()) AND t.created_by = auth.uid()))));
CREATE POLICY "Create comments on accessible tickets" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_active_user(auth.uid())
    AND EXISTS (SELECT 1 FROM tickets t WHERE t.id = comments.ticket_id
    AND (has_role(auth.uid(), 'admin') OR (t.vendor_id = get_user_vendor_id(auth.uid()) AND t.created_by = auth.uid()))));

-- RLS: Ticket Activity
DROP POLICY IF EXISTS "Vendor users can view their ticket activity" ON public.ticket_activity;
DROP POLICY IF EXISTS "System can insert ticket activity" ON public.ticket_activity;

CREATE POLICY "Vendor view own ticket activity" ON public.ticket_activity FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_activity.ticket_id
    AND t.vendor_id = get_user_vendor_id(auth.uid()) AND t.created_by = auth.uid()));
CREATE POLICY "System insert ticket activity" ON public.ticket_activity FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: Vendors
DROP POLICY IF EXISTS "Vendor users can view their vendor" ON public.vendors;
CREATE POLICY "Vendor view own vendor" ON public.vendors FOR SELECT TO authenticated
  USING (id = get_user_vendor_id(auth.uid()));
CREATE POLICY "Create vendor requests" ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- Set existing data to active
UPDATE public.vendors SET status = 'active' WHERE status = 'pending';
UPDATE public.profiles SET status = 'active' WHERE status = 'pending';
