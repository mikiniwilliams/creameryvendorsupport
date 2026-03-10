
-- Internal notes table for admin-only notes on tickets
CREATE TABLE public.internal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view internal notes
CREATE POLICY "Admins can view internal notes"
  ON public.internal_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create internal notes
CREATE POLICY "Admins can insert internal notes"
  ON public.internal_notes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

-- Only admins can update own notes
CREATE POLICY "Admins can update own internal notes"
  ON public.internal_notes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

-- Only admins can delete own notes
CREATE POLICY "Admins can delete internal notes"
  ON public.internal_notes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
