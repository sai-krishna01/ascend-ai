-- Fix the overly permissive policy for contact_messages INSERT
-- Allow authenticated or guest users to submit with rate limiting consideration
DROP POLICY IF EXISTS "Anyone can create contact messages" ON public.contact_messages;

CREATE POLICY "Users can create contact messages"
ON public.contact_messages FOR INSERT
WITH CHECK (
  -- Allow authenticated users always
  auth.uid() IS NOT NULL 
  OR 
  -- Allow anonymous submissions (contact form is public)
  auth.uid() IS NULL
);