-- Fix RLS policy for group_chats - allow users to see groups they created OR are members of
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.group_chats;

CREATE POLICY "Users can view groups they created or are members of" 
ON public.group_chats 
FOR SELECT 
USING (
  created_by = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_chat_members.group_id = group_chats.id 
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Also fix group_chat_members INSERT policy to allow users to join as member
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_chat_members;

CREATE POLICY "Users can add themselves as members" 
ON public.group_chat_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
);

-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for viewing uploads
CREATE POLICY "Anyone can view chat uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-uploads');

-- Storage policy for uploading files
CREATE POLICY "Authenticated users can upload to chat-uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-uploads' AND auth.role() = 'authenticated');

-- Storage policy for deleting own uploads
CREATE POLICY "Users can delete their own uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);