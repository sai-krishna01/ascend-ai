-- Fix group_chats RLS - allow creators to see their groups immediately
DROP POLICY IF EXISTS "Users can view their own groups or member groups" ON public.group_chats;

CREATE POLICY "Users can view their own groups or member groups"
ON public.group_chats
FOR SELECT
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_chat_members.group_id = group_chats.id 
    AND group_chat_members.user_id = auth.uid()
  )
);

-- Fix group_chat_members RLS - allow inserting self as member when user just created the group
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.group_chat_members;

CREATE POLICY "Users can add themselves as members"
ON public.group_chat_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.group_chats 
    WHERE group_chats.id = group_chat_members.group_id
    AND (group_chats.created_by = auth.uid() OR group_chats.is_active = true)
  )
);

-- Add reply_to_id column to chat_messages for replies in AI mentor
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Add reply_to_id column to group_chat_messages for replies in group chat
ALTER TABLE public.group_chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.group_chat_messages(id) ON DELETE SET NULL;