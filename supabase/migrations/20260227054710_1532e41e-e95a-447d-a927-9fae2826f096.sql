
-- Add email to profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update existing profiles with emails (if any exist)
UPDATE public.profiles SET email = (
  SELECT email FROM auth.users WHERE auth.users.id = profiles.user_id
);

-- Update trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

-- Allow admins to update profiles (for vendor assignment)
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
