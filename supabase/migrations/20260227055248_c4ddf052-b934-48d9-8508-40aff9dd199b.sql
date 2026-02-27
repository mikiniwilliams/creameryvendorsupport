
-- Fix overly permissive INSERT policy on notifications
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow inserting notifications for yourself (edge case: manual insert)
-- The triggers use SECURITY DEFINER so they bypass RLS anyway
CREATE POLICY "Users can insert own notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
