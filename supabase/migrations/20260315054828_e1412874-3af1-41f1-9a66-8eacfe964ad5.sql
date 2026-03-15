
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;
