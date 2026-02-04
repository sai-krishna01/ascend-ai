-- Fix infinite recursion in RLS policies for group chat membership

-- 1) Helper functions (SECURITY DEFINER) to avoid self-referential RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_chat_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_chat_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 2) group_chat_members: replace SELECT policy that caused recursion
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_chat_members;

CREATE POLICY "Users can view members of their groups"
ON public.group_chat_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_group_member(group_id, auth.uid())
);

-- 3) group_chats: fix broken UPDATE policy (wrong join) and avoid indirect recursion patterns
DROP POLICY IF EXISTS "Group admins can update groups" ON public.group_chats;

CREATE POLICY "Group admins can update groups"
ON public.group_chats
FOR UPDATE
USING (
  created_by = auth.uid()
  OR public.is_group_admin(id, auth.uid())
);
