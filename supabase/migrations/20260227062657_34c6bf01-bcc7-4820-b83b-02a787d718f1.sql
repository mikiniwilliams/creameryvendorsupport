-- Add length check constraints for input validation
ALTER TABLE tickets ADD CONSTRAINT title_length CHECK (length(title) <= 200);
ALTER TABLE tickets ADD CONSTRAINT description_length CHECK (length(description) <= 5000);
ALTER TABLE comments ADD CONSTRAINT content_length CHECK (length(content) <= 5000);
ALTER TABLE kb_articles ADD CONSTRAINT kb_title_length CHECK (length(title) <= 200);
ALTER TABLE kb_articles ADD CONSTRAINT kb_content_length CHECK (length(content) <= 50000);
ALTER TABLE vendors ADD CONSTRAINT vendor_name_length CHECK (length(name) <= 100);

-- Add INSERT policies on profiles table
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
