
-- Drop the vulnerable policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate INSERT policy: users can only insert with status='pending' and no vendor
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO public
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND vendor_id IS NULL
);

-- For UPDATE, we need a trigger to prevent users from changing status/vendor_id
-- because RLS WITH CHECK cannot reference OLD values directly in all contexts.
-- So we use a trigger-based approach.

CREATE OR REPLACE FUNCTION public.prevent_profile_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the current user is an admin, allow all changes
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admin users cannot change status or vendor_id
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'You cannot change your own status';
  END IF;

  IF NEW.vendor_id IS DISTINCT FROM OLD.vendor_id THEN
    RAISE EXCEPTION 'You cannot change your own vendor assignment';
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_profile_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_self_escalation();

-- Recreate UPDATE policy: users can update own profile (trigger guards sensitive fields)
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
