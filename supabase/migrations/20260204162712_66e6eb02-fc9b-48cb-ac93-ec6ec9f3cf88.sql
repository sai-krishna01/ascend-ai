-- =====================================================
-- FIX: Seed missing platform_settings rows
-- =====================================================

-- Insert default settings if they don't exist
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back later."}'::jsonb, 'Maintenance mode settings'),
  ('registration_enabled', '{"enabled": true}'::jsonb, 'User registration toggle'),
  ('ai_features_enabled', '{"enabled": true}'::jsonb, 'Global AI features toggle')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FIX: Enable realtime for core tables
-- =====================================================

-- Enable realtime for platform_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;

-- Enable realtime for system_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Enable realtime for group_chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chats;

-- Enable realtime for group_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;

-- Enable realtime for group_chat_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_members;

-- Enable realtime for chat_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Enable realtime for custom_pages
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_pages;

-- =====================================================
-- FIX: Add unique constraint on platform_settings key
-- =====================================================

-- Add unique constraint if not exists (for upsert operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_key_unique'
  ) THEN
    ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);
  END IF;
END $$;

-- =====================================================
-- FIX: Add group deletion policy for creators and admins
-- =====================================================

-- Drop existing delete policy if exists, then create new one
DROP POLICY IF EXISTS "Creators and admins can delete groups" ON public.group_chats;

CREATE POLICY "Creators and admins can delete groups"
ON public.group_chats
FOR DELETE
USING (
  created_by = auth.uid() 
  OR is_group_admin(id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'founder'::app_role)
);