-- Create group_chats table for group conversations
CREATE TABLE public.group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('custom', 'subject', 'course')),
  subject TEXT,
  created_by UUID NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  ai_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_chat_members table
CREATE TABLE public.group_chat_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

-- Create group_chat_messages table
CREATE TABLE public.group_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID,
  sender_name TEXT,
  sender_type TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'ai', 'system')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'link', 'ai_response')),
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_interactions table for tracking AI features usage
CREATE TABLE public.ai_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('doubt_solving', 'quiz', 'practice', 'explanation', 'recommendation', 'note_generation')),
  subject TEXT,
  prompt TEXT NOT NULL,
  response TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study_resources table for uploaded files and links
CREATE TABLE public.study_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'image', 'document', 'link', 'video', 'note')),
  url TEXT,
  file_path TEXT,
  subject TEXT,
  uploaded_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

-- Group chats policies
CREATE POLICY "Users can view groups they are members of"
ON public.group_chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_id = id AND user_id = auth.uid()
  ) OR created_by = auth.uid()
);

CREATE POLICY "Users can create groups"
ON public.group_chats FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
ON public.group_chats FOR UPDATE
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Group members policies
CREATE POLICY "Users can view members of their groups"
ON public.group_chat_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members m 
    WHERE m.group_id = group_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can manage members"
ON public.group_chat_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chats 
    WHERE id = group_id AND created_by = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can leave groups"
ON public.group_chat_members FOR DELETE
USING (user_id = auth.uid());

-- Group messages policies
CREATE POLICY "Members can view group messages"
ON public.group_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_id = group_chat_messages.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.group_chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_chat_members 
    WHERE group_id = group_chat_messages.group_id AND user_id = auth.uid()
  )
);

-- AI interactions policies
CREATE POLICY "Users can view their own AI interactions"
ON public.ai_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI interactions"
ON public.ai_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Study resources policies
CREATE POLICY "Public resources are viewable by all"
ON public.study_resources FOR SELECT
USING (is_public = true OR uploaded_by = auth.uid());

CREATE POLICY "Users can upload resources"
ON public.study_resources FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own resources"
ON public.study_resources FOR UPDATE
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own resources"
ON public.study_resources FOR DELETE
USING (auth.uid() = uploaded_by);

-- Add triggers for updated_at
CREATE TRIGGER update_group_chats_updated_at
BEFORE UPDATE ON public.group_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_resources_updated_at
BEFORE UPDATE ON public.study_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;