
-- Add short_id column
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS short_id text;

-- Populate existing tickets
UPDATE public.tickets SET short_id = UPPER(RIGHT(id::text, 6)) WHERE short_id IS NULL;

-- Create trigger function to auto-populate on insert
CREATE OR REPLACE FUNCTION public.set_ticket_short_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.short_id := UPPER(RIGHT(NEW.id::text, 6));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_ticket_short_id
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_short_id();
