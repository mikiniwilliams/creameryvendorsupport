
CREATE OR REPLACE FUNCTION public.lookup_public_ticket(_reference text, _customer_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ticket RECORD;
  _result json;
BEGIN
  -- Reference is last 6 chars of the UUID (case-insensitive match)
  SELECT t.id, t.title, t.status, t.priority, t.issue_type, t.created_at, t.updated_at,
         v.name as vendor_name
  INTO _ticket
  FROM public.tickets t
  LEFT JOIN public.vendors v ON v.id = t.vendor_id
  WHERE UPPER(RIGHT(t.id::text, 6)) = UPPER(_reference)
    AND LOWER(t.customer_email) = LOWER(_customer_email)
    AND t.source = 'public_form'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  _result := json_build_object(
    'id', _ticket.id,
    'title', _ticket.title,
    'status', _ticket.status,
    'priority', _ticket.priority,
    'issue_type', _ticket.issue_type,
    'vendor_name', _ticket.vendor_name,
    'created_at', _ticket.created_at,
    'updated_at', _ticket.updated_at
  );

  RETURN _result;
END;
$$;
