-- Fix group_chats RLS policy to allow creators to see their groups
DROP POLICY IF EXISTS "Users can view groups they created or are members of" ON public.group_chats;

CREATE POLICY "Users can view their own groups or member groups"
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

-- Fix group_chat_members policy - the existing one has a bug (m.group_id = m.group_id)
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_chat_members;

CREATE POLICY "Users can view members of their groups"
ON public.group_chat_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.group_chat_members gcm
    WHERE gcm.group_id = group_chat_members.group_id 
    AND gcm.user_id = auth.uid()
  )
);