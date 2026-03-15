
CREATE OR REPLACE FUNCTION public.log_ticket_edit(
  _ticket_id uuid,
  _activity_type text,
  _old_value text,
  _new_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can log edits
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  INSERT INTO public.ticket_activity (ticket_id, user_id, activity_type, old_value, new_value)
  VALUES (_ticket_id, auth.uid(), _activity_type, _old_value, _new_value);
END;
$$;
