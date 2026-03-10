
-- Add public submission columns to tickets table
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'internal';

-- Create a function for public ticket submission (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.submit_public_ticket(
  _customer_name text,
  _customer_email text,
  _vendor_name text,
  _issue_type text,
  _description text,
  _resolution_request text DEFAULT NULL,
  _transaction_date text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  _ticket_id uuid;
  _vendor_id uuid;
  _full_description text;
  _title text;
  a RECORD;
BEGIN
  -- Build title
  _title := _issue_type || ' — ' || _vendor_name;
  
  -- Try to match vendor by name
  SELECT id INTO _vendor_id FROM public.vendors WHERE LOWER(name) = LOWER(_vendor_name) AND status = 'active' LIMIT 1;
  
  -- Build full description
  _full_description := _description;
  IF _transaction_date IS NOT NULL AND _transaction_date != '' THEN
    _full_description := _full_description || E'\n\nTransaction Date: ' || _transaction_date;
  END IF;
  IF _resolution_request IS NOT NULL AND _resolution_request != '' THEN
    _full_description := _full_description || E'\n\nRequested Resolution: ' || _resolution_request;
  END IF;
  IF _vendor_id IS NULL THEN
    _full_description := _full_description || E'\n\nVendor (not matched): ' || _vendor_name;
  END IF;

  -- Insert ticket - use a placeholder created_by (first admin) since column is NOT NULL
  INSERT INTO public.tickets (
    title, description, status, priority, issue_type, 
    vendor_id, created_by, source, customer_name, customer_email
  )
  SELECT 
    _title, _full_description, 'open', 'medium', 
    CASE _issue_type
      WHEN 'Product Issue' THEN 'general'
      WHEN 'Non-Delivery' THEN 'general'
      WHEN 'Billing Dispute' THEN 'billing'
      WHEN 'Rude/Unprofessional Behavior' THEN 'general'
      ELSE 'general'
    END,
    COALESCE(_vendor_id, (SELECT id FROM public.vendors LIMIT 1)),
    ur.user_id,
    'public_form', _customer_name, _customer_email
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  LIMIT 1
  RETURNING id INTO _ticket_id;
  
  -- Notify all admins
  FOR a IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, ticket_id, type)
    VALUES (a.user_id, 'New Public Support Request', 
      'Public form submission from ' || _customer_name || ': "' || _title || '"',
      _ticket_id, 'new_ticket');
  END LOOP;
  
  RETURN _ticket_id;
END;
$$;

-- Grant execute to anon role so unauthenticated users can call it
GRANT EXECUTE ON FUNCTION public.submit_public_ticket TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_ticket TO authenticated;
