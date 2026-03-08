
CREATE TABLE public.ticket_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  issue_type text NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all templates" ON public.ticket_templates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert templates" ON public.ticket_templates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update templates" ON public.ticket_templates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete templates" ON public.ticket_templates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ticket_templates_updated_at BEFORE UPDATE ON public.ticket_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
